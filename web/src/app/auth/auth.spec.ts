import { TestBed } from '@angular/core/testing';
import { I18n } from '../i18n/i18n';
import { Auth } from './auth';
import { GOOGLE_CLIENT_ID } from './config';
import { makeCredential, provideFakeGoogle } from './testing';

const SESSION_KEY = 'kora:session';
const SAVED = {
  id: '1122334455',
  name: 'Diego Cáceres',
  email: 'diego@example.com',
  picture: 'https://lh3.googleusercontent.com/a/photo=s96-c',
};

function setup(clientId?: string) {
  const { fake, providers } = provideFakeGoogle(clientId);
  TestBed.configureTestingModule({ providers });
  return { fake, auth: TestBed.inject(Auth) };
}

describe('Auth', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    document.documentElement.lang = 'en';
  });

  describe('configuration', () => {
    it('is off when there is no client id', () => {
      TestBed.configureTestingModule({});
      expect(TestBed.inject(GOOGLE_CLIENT_ID)).toBe('');
      expect(TestBed.inject(Auth).enabled).toBe(false);
    });

    it('is on when there is a client id', () => {
      expect(setup().auth.enabled).toBe(true);
    });
  });

  describe('restoring the session', () => {
    it('starts signed out when nothing was saved', () => {
      expect(setup().auth.user()).toBeNull();
    });

    it('restores a saved session', () => {
      localStorage.setItem(SESSION_KEY, JSON.stringify(SAVED));
      expect(setup().auth.user()).toEqual(SAVED);
    });

    it.each([
      ['not json'],
      ['null'],
      ['[]'],
      ['"text"'],
      [JSON.stringify({ ...SAVED, id: '' })],
      [JSON.stringify({ ...SAVED, name: 7 })],
      [JSON.stringify({ ...SAVED, email: undefined })],
      [JSON.stringify({ id: SAVED.id })],
    ])('ignores a damaged session: %s', (saved) => {
      localStorage.setItem(SESSION_KEY, saved);
      expect(setup().auth.user()).toBeNull();
    });

    it('drops a saved picture that is not a secure address', () => {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ ...SAVED, picture: 'javascript:alert(1)' }),
      );
      expect(setup().auth.user()?.picture).toBe('');
    });

    it('starts signed out when the browser will not let the storage be read', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });
      expect(setup().auth.user()).toBeNull();
    });
  });

  describe('drawing the Google button', () => {
    it('gives Google the client id, the current language and the place for the button', async () => {
      const { auth, fake } = setup();
      TestBed.inject(I18n).setLang('pt');
      const host = document.createElement('div');
      await auth.renderButton(host);
      expect(fake.hosts).toEqual([host]);
      expect(fake.options).toEqual([
        { clientId: 'client-1.apps.googleusercontent.com', locale: 'pt' },
      ]);
    });

    it('passes on the failure when Google cannot be loaded', async () => {
      const { auth, fake } = setup();
      fake.renderFailure = new Error('offline');
      await expect(auth.renderButton(document.createElement('div'))).rejects.toThrow('offline');
    });
  });

  describe('signing in', () => {
    it('takes the person from a valid credential and remembers only their data', async () => {
      const { auth, fake } = setup();
      await auth.renderButton(document.createElement('div'));
      fake.pick(makeCredential());
      expect(auth.user()).toEqual(SAVED);
      expect(auth.rejected()).toBe(false);
      expect(JSON.parse(localStorage.getItem(SESSION_KEY) as string)).toEqual(SAVED);
    });

    it.each([
      ['for another app', { aud: 'other.apps.googleusercontent.com' }],
      ['from another issuer', { iss: 'https://evil.example' }],
      ['expired', { exp: 1 }],
    ])('refuses a credential %s', async (_label, overrides) => {
      const { auth, fake } = setup();
      await auth.renderButton(document.createElement('div'));
      fake.pick(makeCredential(overrides));
      expect(auth.user()).toBeNull();
      expect(auth.rejected()).toBe(true);
      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    });

    it('refuses something that is not a token at all', async () => {
      const { auth, fake } = setup();
      await auth.renderButton(document.createElement('div'));
      fake.pick('garbage');
      expect(auth.user()).toBeNull();
      expect(auth.rejected()).toBe(true);
    });

    it('stops showing the refusal after a good sign in', async () => {
      const { auth, fake } = setup();
      await auth.renderButton(document.createElement('div'));
      fake.pick('garbage');
      fake.pick(makeCredential());
      expect(auth.rejected()).toBe(false);
      expect(auth.user()).not.toBeNull();
    });

    it('works even when the browser will not let the session be saved', async () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('full', 'QuotaExceededError');
      });
      const { auth, fake } = setup();
      await auth.renderButton(document.createElement('div'));
      fake.pick(makeCredential());
      expect(auth.user()).toEqual(SAVED);
    });

    it('is still signed in after the page is reloaded', async () => {
      const first = setup();
      await first.auth.renderButton(document.createElement('div'));
      first.fake.pick(makeCredential());
      TestBed.resetTestingModule();
      expect(setup().auth.user()).toEqual(SAVED);
    });
  });

  describe('signing out', () => {
    async function signedIn() {
      const ctx = setup();
      await ctx.auth.renderButton(document.createElement('div'));
      ctx.fake.pick(makeCredential());
      return ctx;
    }

    it('forgets the person and the saved session, and tells Google', async () => {
      const { auth, fake } = await signedIn();
      await auth.signOut();
      expect(auth.user()).toBeNull();
      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
      expect(fake.autoSelectDisabled).toBe(1);
    });

    it('signs out even when Google cannot be told', async () => {
      const { auth, fake } = await signedIn();
      fake.autoSelectFailure = new Error('offline');
      await expect(auth.signOut()).resolves.toBeUndefined();
      expect(auth.user()).toBeNull();
    });

    it('is not signed in after a reload either', async () => {
      const { auth } = await signedIn();
      await auth.signOut();
      TestBed.resetTestingModule();
      expect(setup().auth.user()).toBeNull();
    });
  });
});
