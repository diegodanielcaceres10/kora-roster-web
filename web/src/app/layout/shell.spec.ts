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

  it('shows the language selector in the header', () => {
    const el = setup('en');
    expect(el.querySelector('header app-language-selector')).not.toBeNull();
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

    it.each(['en', 'es', 'pt'] as const)('offers "Sign in" to the account page in %s', (lang) => {
      const el = setup(lang, { signIn: true });
      const link = el.querySelectorAll('header a')[1] as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe(`/${lang}/cuenta`);
      expect(link.textContent?.trim()).toBe(DICTIONARIES[lang].account.signInLink);
    });

    it.each(['en', 'es', 'pt'] as const)(
      'shows the photo of the person, named after the account page, in %s',
      (lang) => {
        const el = setup(lang, { signIn: true, session: true });
        const link = el.querySelectorAll('header a')[1] as HTMLAnchorElement;
        expect(link.getAttribute('href')).toBe(`/${lang}/cuenta`);
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
});
