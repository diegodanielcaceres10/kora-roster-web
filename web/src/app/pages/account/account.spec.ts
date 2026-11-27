import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GOOGLE_IDENTITY } from '../../auth/google-identity';
import { GOOGLE_CLIENT_ID } from '../../auth/config';
import {
  FakeGoogleIdentity,
  makeCredential,
  provideFakeGoogle,
  TEST_CLIENT_ID,
} from '../../auth/testing';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { Account } from './account';

const T = DICTIONARIES.es.account;
const SESSION_KEY = 'kora:session';
const SAVED = {
  id: '1122334455',
  name: 'Diego Daniel Caceres',
  email: 'diego@example.com',
  picture: 'https://lh3.googleusercontent.com/a/photo=s96-c',
};

async function setup(options: { enabled?: boolean; renderFailure?: Error } = {}) {
  let fake: FakeGoogleIdentity;
  if (options.enabled === false) {
    fake = new FakeGoogleIdentity();
    TestBed.configureTestingModule({ providers: [{ provide: GOOGLE_IDENTITY, useValue: fake }] });
  } else {
    const google = provideFakeGoogle();
    fake = google.fake;
    TestBed.configureTestingModule({ providers: google.providers });
  }
  fake.renderFailure = options.renderFailure ?? null;
  TestBed.inject(I18n).setLang('es');

  const fixture = TestBed.createComponent(Account);
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  await settle();
  const el = fixture.nativeElement as HTMLElement;
  const host = () => el.querySelector('[data-google-button]');
  const signOutButton = () =>
    Array.from(el.querySelectorAll('ui-button button')).find(
      (b) => b.textContent?.trim() === T.signOut,
    ) as HTMLButtonElement | undefined;
  return { fixture, el, fake, settle, host, signOutButton };
}

describe('Account page', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    document.title = '';
    document.documentElement.lang = 'en';
    document.head
      .querySelectorAll('link[data-kora-seo], meta[name="description"], meta[name="robots"]')
      .forEach((el) => el.remove());
  });

  describe('while sign in is off', () => {
    it('says it is not available and never asks Google for anything', async () => {
      const { el, fake, host } = await setup({ enabled: false });
      expect(el.querySelector('h1')?.textContent).toContain(T.title);
      expect(el.textContent).toContain(T.unavailable);
      expect(host()).toBeNull();
      expect(fake.hosts).toHaveLength(0);
    });
  });

  describe('signed out', () => {
    it('invites to sign in and has Google draw its button in the page, in the page language', async () => {
      const { el, fake, host } = await setup();
      expect(el.textContent).toContain(T.signInPrompt);
      expect(fake.hosts).toHaveLength(1);
      expect(fake.hosts[0]).toBe(host());
      expect(fake.options[0].locale).toBe('es');
    });

    it('says so when Google cannot be loaded', async () => {
      const { el } = await setup({ renderFailure: new Error('offline') });
      expect(el.querySelector('[role="alert"]')?.textContent).toContain(T.scriptError);
    });

    it('says so when Google sends a credential that is not valid', async () => {
      const { el, fake, settle } = await setup();
      fake.pick('garbage');
      await settle();
      expect(el.querySelector('[role="alert"]')?.textContent).toContain(T.invalidToken);
      expect(el.textContent).toContain(T.signInPrompt);
    });

    it('shows no error before anything went wrong', async () => {
      const { el } = await setup();
      expect(el.querySelector('[role="alert"]')).toBeNull();
    });
  });

  describe('signing in', () => {
    it('shows the Google data of the person and hides the invitation', async () => {
      const { el, fake, settle, host } = await setup();
      fake.pick(makeCredential());
      await settle();
      const text = el.textContent as string;
      expect(text).toContain(T.nameLabel);
      expect(text).toContain('Diego Daniel Caceres');
      expect(text).toContain(T.emailLabel);
      expect(text).toContain('diego@example.com');
      expect(text).not.toContain(T.signInPrompt);
      expect(host()).toBeNull();
      expect(el.querySelector('img')?.getAttribute('src')).toBe(SAVED.picture);
    });

    it('shows the initial of the name when Google sends no photo', async () => {
      const { el, fake, settle } = await setup();
      fake.pick(makeCredential({ picture: undefined }));
      await settle();
      expect(el.querySelector('img')).toBeNull();
      expect(el.textContent).toContain('D');
    });

    it('shows a session that was already saved, without asking Google for a button', async () => {
      localStorage.setItem(SESSION_KEY, JSON.stringify(SAVED));
      const { el, fake } = await setup();
      expect(el.textContent).toContain('diego@example.com');
      expect(fake.hosts).toHaveLength(0);
    });
  });

  describe('signing out', () => {
    it('goes back to the invitation and has Google draw its button again', async () => {
      const { el, fake, settle, signOutButton } = await setup();
      fake.pick(makeCredential());
      await settle();
      (signOutButton() as HTMLButtonElement).click();
      await settle();
      expect(el.textContent).toContain(T.signInPrompt);
      expect(el.textContent).not.toContain('diego@example.com');
      expect(fake.hosts).toHaveLength(2);
      expect(fake.autoSelectDisabled).toBe(1);
    });
  });

  describe('the page itself', () => {
    it('has its own title, description and stays out of search results', async () => {
      await setup();
      expect(document.title).toBe(DICTIONARIES.es.meta.account.title);
      expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
        DICTIONARIES.es.meta.account.description,
      );
      expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
        'noindex',
      );
    });
  });

  describe('the preferences', () => {
    it('are not offered while signed out', async () => {
      const { el } = await setup();
      expect(el.querySelector('app-preferences-editor')).toBeNull();
    });

    it('are offered once the person signs in, and go away when they sign out', async () => {
      const { el, fake, settle, signOutButton } = await setup();
      fake.pick(makeCredential());
      await settle();
      expect(el.querySelector('app-preferences-editor')).not.toBeNull();
      (signOutButton() as HTMLButtonElement).click();
      await settle();
      expect(el.querySelector('app-preferences-editor')).toBeNull();
    });

    it('are offered right away to a session that was already saved', async () => {
      localStorage.setItem(SESSION_KEY, JSON.stringify(SAVED));
      const { el } = await setup();
      expect(el.querySelector('app-preferences-editor')).not.toBeNull();
    });
  });

  describe('the Google script, with the real client', () => {
    const scripts = () => document.head.querySelectorAll('script[src*="accounts.google.com"]');

    async function createOn(platform: 'server' | 'browser') {
      TestBed.configureTestingModule({
        providers: [
          { provide: GOOGLE_CLIENT_ID, useValue: TEST_CLIENT_ID },
          { provide: PLATFORM_ID, useValue: platform },
        ],
      });
      TestBed.inject(I18n).setLang('es');
      const fixture = TestBed.createComponent(Account);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    afterEach(() => scripts().forEach((script) => script.remove()));

    it('is not written into the page while prerendering, so it ships in no static HTML', async () => {
      await createOn('server');
      expect(scripts()).toHaveLength(0);
    });

    it('is added once in the browser', async () => {
      await createOn('browser');
      expect(scripts()).toHaveLength(1);
    });
  });

  describe('the Premium card', () => {
    it('is not shown while signed out', async () => {
      const { el } = await setup();
      expect(el.querySelector('app-premium-card')).toBeNull();
    });

    it('is not shown to somebody who is signed in either: the page goes from the profile to the preferences', async () => {
      localStorage.setItem(SESSION_KEY, JSON.stringify(SAVED));
      const { el } = await setup();
      expect(el.querySelector('app-premium-card')).toBeNull();
      expect(el.textContent).not.toContain('Lo que viene con Premium');
      const profile = el.querySelector('[data-profile]') as HTMLElement;
      const editor = el.querySelector('app-preferences-editor') as HTMLElement;
      expect(
        profile.compareDocumentPosition(editor) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('has nothing about what comes with Premium, in any language', async () => {
      localStorage.setItem(SESSION_KEY, JSON.stringify(SAVED));
      const { el, settle } = await setup();
      for (const lang of ['en', 'es', 'pt'] as const) {
        TestBed.inject(I18n).setLang(lang);
        await settle();
        expect(el.querySelector('h2')?.textContent ?? '').not.toMatch(/^\s*Premium\s*$/);
        expect(el.querySelectorAll('ul button[aria-disabled="true"]')).toHaveLength(0);
      }
    });
  });

  it.each(['en', 'es', 'pt'] as const)(
    'has the title and says what the account is for under it in %s',
    async (lang) => {
      const { el, settle } = await setup();
      TestBed.inject(I18n).setLang(lang);
      await settle();
      expect(el.querySelector('h1')?.textContent?.trim()).toBe(DICTIONARIES[lang].account.title);
      expect(el.querySelector('h1 + p')?.textContent?.trim()).toBe(
        DICTIONARIES[lang].account.subtitle,
      );
    },
  );

  describe('the profile card', () => {
    it('shows the email with the at sign, and a dot that says the session is open', async () => {
      const { el, fake, settle } = await setup();
      fake.pick(makeCredential());
      await settle();
      const card = el.querySelector('[data-profile]') as HTMLElement;
      expect(card.querySelector('ui-icon[data-icon="at"]')).not.toBeNull();
      expect(card.querySelector('[data-online]')).not.toBeNull();
      expect(card.querySelector('[data-online]')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('keeps the name as the heading of the card, and the labels for assistive technology', async () => {
      const { el, fake, settle } = await setup();
      fake.pick(makeCredential());
      await settle();
      const card = el.querySelector('[data-profile]') as HTMLElement;
      expect(card.querySelector('h2')?.textContent?.trim()).toBe('Diego Daniel Caceres');
      for (const label of Array.from(card.querySelectorAll('dt'))) {
        expect(label.classList.contains('sr-only')).toBe(true);
      }
    });
  });
});
