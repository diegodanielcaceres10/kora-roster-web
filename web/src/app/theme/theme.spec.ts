import { TestBed } from '@angular/core/testing';
import { Theme, THEME_STORAGE_KEY } from './theme';

type System = 'light' | 'dark' | 'unknown';

// jsdom has no matchMedia, so the preferred color scheme is declared by the test.
function setSystem(scheme: System): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value:
      scheme === 'unknown'
        ? undefined
        : (query: string) => ({
            matches: scheme === 'dark' && query === '(prefers-color-scheme: dark)',
            media: query,
          }),
  });
}

const isDarkPage = () => document.documentElement.classList.contains('dark');

function create(): Theme {
  TestBed.resetTestingModule();
  return TestBed.inject(Theme);
}

describe('Theme', () => {
  beforeEach(() => {
    localStorage.clear();
    setSystem('light');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    localStorage.clear();
    setSystem('unknown');
    vi.restoreAllMocks();
  });

  describe('first mode', () => {
    it.each<System>(['light', 'dark'])('follows the system (%s) when nothing is saved', (scheme) => {
      setSystem(scheme);
      expect(create().mode()).toBe(scheme);
    });

    it('is light when the browser cannot tell the preferred scheme', () => {
      setSystem('unknown');
      expect(create().mode()).toBe('light');
    });

    it.each<['light' | 'dark', System]>([
      ['light', 'dark'],
      ['dark', 'light'],
    ])('uses the saved choice (%s) over the system (%s)', (saved, scheme) => {
      localStorage.setItem(THEME_STORAGE_KEY, saved);
      setSystem(scheme);
      expect(create().mode()).toBe(saved);
    });

    it('ignores a saved value it does not know', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
      setSystem('dark');
      expect(create().mode()).toBe('dark');
    });
  });

  describe('the page', () => {
    it('carries the dark class on <html> only in dark mode', () => {
      setSystem('dark');
      const theme = create();
      expect(isDarkPage()).toBe(true);
      theme.set('light');
      expect(isDarkPage()).toBe(false);
      theme.set('dark');
      expect(isDarkPage()).toBe(true);
    });
  });

  describe('changing it', () => {
    it('toggle flips the mode and keeps the page in step', () => {
      const theme = create();
      expect(theme.mode()).toBe('light');
      theme.toggle();
      expect(theme.mode()).toBe('dark');
      expect(isDarkPage()).toBe(true);
      theme.toggle();
      expect(theme.mode()).toBe('light');
      expect(isDarkPage()).toBe(false);
    });

    it('remembers the choice for the next visit', () => {
      create().set('dark');
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
      setSystem('light');
      expect(create().mode()).toBe('dark');
    });

    it('keeps working when the browser refuses to save', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      const theme = create();
      expect(() => theme.set('dark')).not.toThrow();
      expect(theme.mode()).toBe('dark');
      expect(isDarkPage()).toBe(true);
    });
  });
});
