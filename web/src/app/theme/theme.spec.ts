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
    it.each<[System, 'light' | 'dark']>([
      ['light', 'light'],
      ['dark', 'dark'],
      ['unknown', 'light'],
    ])('follows the system (%s) when nothing is saved', (scheme, expected) => {
      setSystem(scheme);
      expect(create().mode()).toBe(expected);
    });

    it('puts the dark class on the page when the system is dark and nothing is saved', () => {
      setSystem('dark');
      create();
      expect(isDarkPage()).toBe(true);
    });

    it('does not save what the system chose, so it is still not a choice of the person', () => {
      setSystem('dark');
      create();
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    });

    it.each<'light' | 'dark'>(['light', 'dark'])(
      'uses the saved choice (%s) over the system',
      (saved) => {
        setSystem(saved === 'dark' ? 'light' : 'dark');
        localStorage.setItem(THEME_STORAGE_KEY, saved);
        expect(create().mode()).toBe(saved);
      },
    );

    it('ignores a saved value it does not know and follows the system', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
      setSystem('dark');
      expect(create().mode()).toBe('dark');
    });

    it('follows the system when the browser blocks reading the saved choice', () => {
      setSystem('dark');
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      expect(create().mode()).toBe('dark');
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
