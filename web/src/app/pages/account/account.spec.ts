import { TestBed } from '@angular/core/testing';
import { GOOGLE_IDENTITY } from '../../auth/google-identity';
import { FakeGoogleIdentity, makeCredential, provideFakeGoogle } from '../../auth/testing';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { Account } from './account';

const T = DICTIONARIES.es.account;
const SESSION_KEY = 'kora:session';
const SAVED = {
  id: '1122334455',
  name: 'Diego Cáceres',
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
      expect(text).toContain('Diego Cáceres');
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
});
