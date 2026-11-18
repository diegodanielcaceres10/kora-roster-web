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

  // The system is not followed yet: until every screen uses the color tokens, dark would show
  // up half done. When the redesign is finished, bring the "follows the system" tests back
  // (see the history of this file) and read the preference again in Theme and index.html.
  describe('first mode', () => {
    it.each<System>(['light', 'dark', 'unknown'])(
      'is light when nothing is saved, whatever the system (%s) prefers',
      (scheme) => {
        setSystem(scheme);
        expect(create().mode()).toBe('light');
      },
    );

    it.each<'light' | 'dark'>(['light', 'dark'])('uses the saved choice (%s)', (saved) => {
      localStorage.setItem(THEME_STORAGE_KEY, saved);
      expect(create().mode()).toBe(saved);
    });

    it('ignores a saved value it does not know', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
      expect(create().mode()).toBe('light');
    });
  });

  describe('the page', () => {
    it('carries the dark class on <html> only in dark mode', () => {
      const theme = create();
      expect(isDarkPage()).toBe(false);
      theme.set('dark');
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
