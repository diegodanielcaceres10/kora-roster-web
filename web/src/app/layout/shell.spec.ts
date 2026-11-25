import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideFakeGoogle } from '../auth/testing';
import { DICTIONARIES } from '../i18n/dictionaries';
import { I18n } from '../i18n/i18n';
import { Shell } from './shell';

const SESSION_KEY = 'kora-session-placeholder';
const SAVED = {
  id: '1122334455',
  name: 'Diego Cáceres',
  email: 'diego@example.com',
  picture: 'https://lh3.googleusercontent.com/a/photo=s96-c',
};

function setup(lang: 'en' | 'es' | 'pt', options: { signIn?: boolean; session?: boolean } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), ...(options.signIn ? provideFakeGoogle().providers : [])],
  });
  if (options.session) localStorage.setItem('kora:session', JSON.stringify(SAVED));
  TestBed.inject(I18n).setLang(lang);
  const fixture = TestBed.createComponent(Shell);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('Shell', () => {
  afterEach(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.clear();
    document.documentElement.lang = 'en';
  });

  it.each(['en', 'es', 'pt'] as const)('links the logo to the landing in %s', (lang) => {
    const el = setup(lang);
    expect(el.querySelector('header a')?.getAttribute('href')).toBe(`/${lang}`);
  });

  it('shows the language menu in the header', () => {
    const el = setup('en');
    expect(el.querySelector('header app-language-menu')).not.toBeNull();
  });

  it('shows the theme toggle in the header', () => {
    const el = setup('en');
    expect(el.querySelector('header app-theme-toggle button')).not.toBeNull();
  });

  it('names the product in the header with the Roster tag', () => {
    const el = setup('en');
    const logo = el.querySelector('header a') as HTMLElement;
    expect(logo.textContent).toContain('Kora');
    expect(logo.textContent).toContain('Roster');
  });

  it('uses the shared logo in the header, inside the link to the landing', () => {
    const el = setup('en');
    expect(el.querySelector('header a > ui-logo')).not.toBeNull();
    expect(el.querySelectorAll('header ui-logo')).toHaveLength(1);
  });

  it('uses the same shared logo in the footer, without a link around it', () => {
    const el = setup('en');
    expect(el.querySelectorAll('footer ui-logo')).toHaveLength(1);
    expect(el.querySelector('footer a > ui-logo')).toBeNull();
  });

  it('has no copy of the logo markup in the shell, only the shared component', () => {
    const el = setup('en');
    expect(el.querySelectorAll('img[src="favicon.png"]')).toHaveLength(2);
    for (const image of Array.from(el.querySelectorAll('img[src="favicon.png"]'))) {
      expect(image.closest('ui-logo')).not.toBeNull();
    }
  });

  it('puts the routed page inside the main area', () => {
    const el = setup('en');
    expect(el.querySelector('main router-outlet')).not.toBeNull();
  });

  it('closes with a footer', () => {
    const el = setup('en');
    expect(el.querySelector('footer')?.textContent).toContain('Kora Roster');
  });

  describe('the account link', () => {
    it('is not there while sign in is off', () => {
      const el = setup('es');
      expect(el.querySelectorAll('header a')).toHaveLength(1);
    });

    it.each(['en', 'es', 'pt'] as const)(
      'offers "Sign in" to the account page as a user icon in %s',
      (lang) => {
        const el = setup(lang, { signIn: true });
        const link = el.querySelector('header ui-icon-link a') as HTMLAnchorElement;
        expect(link.getAttribute('href')).toBe(`/${lang}/account`);
        expect(link.getAttribute('aria-label')).toBe(DICTIONARIES[lang].account.signInLink);
        expect(link.querySelector('ui-icon[data-icon="user"]')).not.toBeNull();
      },
    );

    it.each(['en', 'es', 'pt'] as const)(
      'shows the photo of the person, named after the account page, in %s',
      (lang) => {
        const el = setup(lang, { signIn: true, session: true });
        const link = el.querySelectorAll('header a')[1] as HTMLAnchorElement;
        expect(el.querySelector('header ui-icon-link a')).toBeNull();
        expect(link.getAttribute('href')).toBe(`/${lang}/account`);
        expect(link.getAttribute('aria-label')).toBe(DICTIONARIES[lang].account.title);
        expect(link.querySelector('app-user-avatar img')?.getAttribute('src')).toBe(SAVED.picture);
        expect(link.textContent).not.toContain(DICTIONARIES[lang].account.signInLink);
      },
    );

    it('stays hidden when sign in is off, even if a session was saved', () => {
      const el = setup('es', { session: true });
      expect(el.querySelectorAll('header a')).toHaveLength(1);
    });
  });

  it.each(['en', 'es', 'pt'] as const)('shows the tagline of the footer in %s', (lang) => {
    const el = setup(lang);
    expect(el.querySelector('footer')?.textContent).toContain(DICTIONARIES[lang].footer.tagline);
  });

  describe('the footer', () => {
    it.each(['en', 'es', 'pt'] as const)('credits the author and keeps the rights in %s', (lang) => {
      const text = setup(lang).querySelector('footer')?.textContent ?? '';
      expect(text).toContain(`${DICTIONARIES[lang].footer.developedBy} Diego Daniel Caceres`);
      expect(text).toContain(DICTIONARIES[lang].footer.rights);
    });

    it('shows the current year in the copyright', () => {
      const text = setup('en').querySelector('footer')?.textContent ?? '';
      expect(text).toContain(`© ${new Date().getFullYear()} Kora Roster`);
    });

    describe('the link on the name of the author', () => {
      // The shell is set up once per test, so the link is looked up in the page that was made.
      const link = (lang: 'en' | 'es' | 'pt' = 'es') =>
        setup(lang).querySelector('footer a') as HTMLAnchorElement;

      it('goes to Nura, the portfolio of the author, from the name', () => {
        const author = link();
        expect(author.getAttribute('href')).toBe('https://diegodanielcaceres10.github.io/nura/');
        expect(author.firstChild?.textContent?.trim()).toBe('Diego Daniel Caceres');
      });

      it('opens in a new tab without giving the other page a hold on this one', () => {
        const author = link();
        expect(author.getAttribute('target')).toBe('_blank');
        const rel = author.getAttribute('rel') ?? '';
        expect(rel).toContain('noopener');
        expect(rel).toContain('noreferrer');
      });

      it.each(['en', 'es', 'pt'] as const)(
        'says it opens in a new tab, for screen readers, in %s',
        (lang) => {
          const footer = setup(lang).querySelector('footer') as HTMLElement;
          const hint = footer.querySelector('a .sr-only') as HTMLElement;
          expect(hint.textContent).toContain(DICTIONARIES[lang].footer.newTab);
        },
      );

      it('has no separate portfolio label or name any more', () => {
        const text = setup('en').querySelector('footer')?.textContent ?? '';
        expect(text).not.toContain('Nura');
        expect(text).not.toContain('Portfolio');
        expect(text).not.toContain('·');
        expect(text).not.toContain('Cáceres');
      });

      it('is the only link: there are no legal pages or version to point to yet', () => {
        expect(setup('en').querySelectorAll('footer a')).toHaveLength(1);
      });
    });
  });
});
