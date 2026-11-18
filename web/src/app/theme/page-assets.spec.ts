import { readFileSync } from 'node:fs';
import { THEME_STORAGE_KEY } from './theme';

const html = readFileSync('src/index.html', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
  dependencies: Record<string, string>;
};

// The block of a rule such as `:root { ... }` or `.dark { ... }`, without its braces.
function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) return '';
  return css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
}

const declared = (body: string) =>
  [...body.matchAll(/(--[a-z-]+)\s*:/g)].map((match) => match[1]).sort();

describe('index.html', () => {
  it('loads no stylesheet from another site', () => {
    const external = html.match(/<link[^>]*rel="stylesheet"[^>]*href="https?:\/\/[^"]*"/g);
    expect(external).toBeNull();
  });

  describe('the script that sets the theme before the page is painted', () => {
    const source = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';
    const run = () => new Function(source)();
    const isDark = () => document.documentElement.classList.contains('dark');

    function system(scheme: 'light' | 'dark') {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: (query: string) => ({ matches: scheme === 'dark' && query.includes('dark') }),
      });
    }

    afterEach(() => {
      document.documentElement.classList.remove('dark');
      localStorage.clear();
      Object.defineProperty(window, 'matchMedia', { configurable: true, value: undefined });
      vi.restoreAllMocks();
    });

    it('exists and reads the same key as the Theme service', () => {
      expect(source).toContain(`'${THEME_STORAGE_KEY}'`);
    });

    it('turns dark on for a saved dark choice', () => {
      system('light');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      run();
      expect(isDark()).toBe(true);
    });

    it('stays light for a saved light choice even if the system is dark', () => {
      system('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      run();
      expect(isDark()).toBe(false);
    });

    // Same temporary rule as Theme: the system is not followed until the redesign is finished.
    it.each<'light' | 'dark'>(['light', 'dark'])(
      'stays light when nothing is saved, whatever the system (%s) prefers',
      (scheme) => {
        system(scheme);
        run();
        expect(isDark()).toBe(false);
      },
    );

    it('does not break the page when the browser blocks storage', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      expect(run).not.toThrow();
    });
  });
});

describe('fonts', () => {
  const FONTS = [
    '@fontsource-variable/inter',
    '@fontsource-variable/space-grotesk',
    '@fontsource-variable/jetbrains-mono',
  ];

  it.each(FONTS)('serves %s from the site itself', (name) => {
    expect(pkg.dependencies[name]).toBeDefined();
    expect(css).toContain(`@import '${name}`);
  });

  it('gives body, titles and labels their own family, each with a fallback', () => {
    expect(css).toMatch(/--font-sans:\s*'Inter Variable',[^;]*sans-serif/);
    expect(css).toMatch(/--font-display:\s*'Space Grotesk Variable',/);
    expect(css).toMatch(/--font-mono:\s*'JetBrains Mono Variable',[^;]*monospace/);
  });

  it('draws the titles with the display family', () => {
    expect(css).toMatch(/h1,\s*h2,\s*h3\s*\{[^}]*font-family:\s*var\(--font-display\)/);
  });
});

describe('color tokens', () => {
  const TOKENS = [
    '--canvas',
    '--ink',
    '--ink-faint',
    '--ink-muted',
    '--line',
    '--surface',
    '--surface-muted',
  ];

  it('are defined for the light look', () => {
    expect(declared(block(':root'))).toEqual(expect.arrayContaining(TOKENS));
  });

  it('are redefined, all of them and nothing else, for the dark look', () => {
    expect(declared(block('.dark'))).toEqual(TOKENS);
  });

  it('become Tailwind colors that follow the mode', () => {
    for (const token of TOKENS) {
      const name = token.slice(2);
      expect(css).toContain(`--color-${name}: var(${token})`);
    }
  });

  it('switch on a dark class, and tell the browser to draw its controls dark too', () => {
    expect(css).toContain('@custom-variant dark');
    expect(block('.dark')).toContain('color-scheme: dark');
    expect(block(':root')).toContain('color-scheme: light');
  });

  it('draws the focus ring with the ink token, so it shows in both modes', () => {
    expect(css).toMatch(/\*:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--ink\)/);
  });

  it('paints the page with the canvas and ink tokens over a faint dot grid', () => {
    const body = block('  body');
    expect(body).toContain('bg-canvas');
    expect(body).toContain('text-ink');
    expect(body).toContain('radial-gradient(var(--line)');
  });
});
