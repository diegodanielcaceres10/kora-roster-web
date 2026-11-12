import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18n } from '../i18n/i18n';
import { DICTIONARIES } from '../i18n/dictionaries';
import { LockNotice } from './lock-notice';
import { LockReason } from './entitlements';

function setup(lang: 'en' | 'es' | 'pt' = 'es') {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  TestBed.inject(I18n).setLang(lang);
  const fixture = TestBed.createComponent(LockNotice);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const show = (reason: LockReason | null, message: string | null) => {
    fixture.componentRef.setInput('reason', reason);
    fixture.componentRef.setInput('message', message);
    fixture.detectChanges();
  };
  const region = () => el.querySelector('[role="status"]') as HTMLElement;
  return { el, show, region };
}

describe('LockNotice', () => {
  afterEach(() => {
    document.documentElement.lang = 'en';
  });

  it('keeps an empty status region in the page, so a notice that appears is announced', () => {
    const { region } = setup();
    expect(region()).not.toBeNull();
    expect(region().textContent?.trim()).toBe('');
  });

  it('shows the message once it is given, and removes it when it is cleared', () => {
    const { show, region } = setup();
    show('premium', 'Disponible con Premium.');
    expect(region().textContent).toContain('Disponible con Premium.');
    show(null, null);
    expect(region().textContent?.trim()).toBe('');
    expect(region()).not.toBeNull();
  });

  it.each(['en', 'es', 'pt'] as const)(
    'offers a link to sign in, to the account page in %s, when an account is missing',
    (lang) => {
      const { show, el } = setup(lang);
      show('sign-in', 'Texto');
      const link = el.querySelector('a') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe(`/${lang}/account`);
      expect(link.textContent?.trim()).toBe(DICTIONARIES[lang].locks.signInLink);
    },
  );

  it('offers no link when the reason is Premium, since an account would not help', () => {
    const { show, el } = setup();
    show('premium', 'Texto');
    expect(el.querySelector('a')).toBeNull();
  });
});
