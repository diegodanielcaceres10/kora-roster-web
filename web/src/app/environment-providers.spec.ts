import { TestBed } from '@angular/core/testing';
import { Auth } from './auth/auth';
import { GOOGLE_CLIENT_ID } from './auth/config';
import { provideEnvironment } from './environment-providers';
import { I18n } from './i18n/i18n';
import { PageMeta } from './i18n/page-meta';
import { SITE_URL } from './i18n/site';

const CLIENT_ID = 'abc-123.apps.googleusercontent.com';

describe('provideEnvironment', () => {
  afterEach(() => {
    document.head
      .querySelectorAll('link[data-kora-seo], meta[name="description"]')
      .forEach((el) => el.remove());
    document.title = '';
    document.documentElement.lang = 'en';
  });

  it('gives the app the client id and the site address of the environment', () => {
    TestBed.configureTestingModule({
      providers: provideEnvironment({ googleClientId: CLIENT_ID, siteUrl: 'https://kora.test' }),
    });
    expect(TestBed.inject(GOOGLE_CLIENT_ID)).toBe(CLIENT_ID);
    expect(TestBed.inject(SITE_URL)).toBe('https://kora.test');
  });

  it('turns sign in on when the environment has a client id', () => {
    TestBed.configureTestingModule({
      providers: provideEnvironment({ googleClientId: CLIENT_ID, siteUrl: '' }),
    });
    expect(TestBed.inject(Auth).enabled).toBe(true);
  });

  it('keeps sign in off when the environment leaves the client id empty', () => {
    TestBed.configureTestingModule({
      providers: provideEnvironment({ googleClientId: '', siteUrl: '' }),
    });
    expect(TestBed.inject(Auth).enabled).toBe(false);
  });

  it('writes the canonical link of the pages once the environment has a site address', () => {
    TestBed.configureTestingModule({
      providers: provideEnvironment({ googleClientId: '', siteUrl: 'https://kora.test' }),
    });
    TestBed.inject(I18n).setLang('es');
    TestBed.inject(PageMeta).apply('landing');
    const canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    expect(canonical.href).toBe('https://kora.test/es');
  });

  it('writes no links while the environment leaves the site address empty', () => {
    TestBed.configureTestingModule({
      providers: provideEnvironment({ googleClientId: '', siteUrl: '' }),
    });
    TestBed.inject(PageMeta).apply('landing');
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
  });
});
