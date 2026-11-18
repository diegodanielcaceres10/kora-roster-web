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
      expect(text).toContain(DICTIONARIES[lang].footer.developedBy);
      expect(text).toContain('Diego Daniel Cáceres');
      expect(text).toContain(DICTIONARIES[lang].footer.rights);
    });

    it('shows the current year in the copyright', () => {
      const text = setup('en').querySelector('footer')?.textContent ?? '';
      expect(text).toContain(`© ${new Date().getFullYear()} Kora Roster`);
    });

    it('links nowhere: there are no legal pages or version to point to yet', () => {
      expect(setup('en').querySelectorAll('footer a')).toHaveLength(0);
    });
  });
});
