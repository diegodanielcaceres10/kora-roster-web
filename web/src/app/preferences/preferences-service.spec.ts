import { TestBed } from '@angular/core/testing';
import { Auth } from '../auth/auth';
import { makeCredential, provideFakeGoogle } from '../auth/testing';
import { DEFAULT_PREFERENCES, Preferences } from './preferences';
import { PreferencesService } from './preferences-service';

const KEY = (id: string) => `kora:prefs:${id}`;
const ME = '1122334455';
const OTHER = '9988776655';

const mine: Preferences = {
  playersPerTeam: 7,
  teams: [
    { icon: '🟢', color: '#00ff00' },
    { icon: '🟡', color: '#ffff00' },
  ],
  header: '⚽ Amistoso',
  footer: 'Confirmen',
  numbering: 'paren',
};
const theirs: Preferences = { ...DEFAULT_PREFERENCES, header: 'Otro', numbering: 'dash' };

const stored = (preferences: unknown, version: unknown = 1) =>
  JSON.stringify({ version, preferences });

async function setup() {
  const google = provideFakeGoogle();
  TestBed.configureTestingModule({ providers: google.providers });
  const auth = TestBed.inject(Auth);
  const service = TestBed.inject(PreferencesService);
  await auth.renderButton(document.createElement('div'));
  const signIn = (sub = ME) => google.fake.pick(makeCredential({ sub }));
  return { auth, service, signIn };
}

describe('PreferencesService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    document.documentElement.lang = 'en';
  });

  describe('who has preferences', () => {
    it('nobody while signed out', async () => {
      const { service } = await setup();
      expect(service.active()).toBeNull();
    });

    it('someone who signs in with nothing saved gets the defaults', async () => {
      const { service, signIn } = await setup();
      signIn();
      expect(service.active()).toEqual(DEFAULT_PREFERENCES);
    });

    it('goes back to nobody when they sign out', async () => {
      const { service, auth, signIn } = await setup();
      signIn();
      await auth.signOut();
      expect(service.active()).toBeNull();
    });
  });

  describe('reading what was saved', () => {
    it('gives back what the account saved', async () => {
      localStorage.setItem(KEY(ME), stored(mine));
      const { service, signIn } = await setup();
      signIn();
      expect(service.active()).toEqual(mine);
    });

    it('keeps each account apart', async () => {
      localStorage.setItem(KEY(ME), stored(mine));
      localStorage.setItem(KEY(OTHER), stored(theirs));
      const { service, auth, signIn } = await setup();
      signIn(ME);
      expect(service.active()).toEqual(mine);
      await auth.signOut();
      signIn(OTHER);
      expect(service.active()).toEqual(theirs);
    });

    it('repairs damaged values one by one without losing the good ones', async () => {
      localStorage.setItem(
        KEY(ME),
        stored({ numbering: 'roman', header: 'Hola', playersPerTeam: 9, teams: 'x' }),
      );
      const { service, signIn } = await setup();
      signIn();
      expect(service.active()).toEqual({
        ...DEFAULT_PREFERENCES,
        header: 'Hola',
        playersPerTeam: 9,
        numbering: 'dot',
      });
    });

    it.each([
      ['text that is not JSON', 'not json'],
      ['JSON of another kind', '[]'],
      ['nothing', 'null'],
      ['a version it does not know', stored(mine, 2)],
      ['no version', JSON.stringify({ preferences: mine })],
    ])('uses the defaults for %s', async (_label, saved) => {
      localStorage.setItem(KEY(ME), saved);
      const { service, signIn } = await setup();
      signIn();
      expect(service.active()).toEqual(DEFAULT_PREFERENCES);
    });

    it('uses the defaults when the browser will not let the storage be read', async () => {
      const { service, signIn } = await setup();
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });
      signIn();
      expect(service.active()).toEqual(DEFAULT_PREFERENCES);
    });
  });

  describe('saving', () => {
    it('writes them under the account, with a version, and uses them right away', async () => {
      const { service, signIn } = await setup();
      signIn();
      service.save(mine);
      expect(service.active()).toEqual(mine);
      expect(JSON.parse(localStorage.getItem(KEY(ME)) as string)).toEqual({
        version: 1,
        preferences: mine,
      });
    });

    it('cleans what it is given before keeping it', async () => {
      const { service, signIn } = await setup();
      signIn();
      service.save({ ...mine, numbering: 'roman' as never, header: 'x'.repeat(300) });
      expect(service.active()?.numbering).toBe('dot');
      expect(service.active()?.header).toBe('x'.repeat(200));
    });

    it('does not touch the preferences of another account', async () => {
      localStorage.setItem(KEY(OTHER), stored(theirs));
      const { service, signIn } = await setup();
      signIn(ME);
      service.save(mine);
      expect(JSON.parse(localStorage.getItem(KEY(OTHER)) as string).preferences).toEqual(theirs);
    });

    it('does nothing while signed out', async () => {
      const { service } = await setup();
      service.save(mine);
      expect(service.active()).toBeNull();
      expect(localStorage.length).toBe(0);
    });

    it('still lets the person use them when the browser will not save', async () => {
      const { service, signIn } = await setup();
      signIn();
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('full', 'QuotaExceededError');
      });
      expect(() => service.save(mine)).not.toThrow();
      expect(service.active()).toEqual(mine);
    });

    it('are still there after the page is reloaded', async () => {
      const first = await setup();
      first.signIn();
      first.service.save(mine);

      TestBed.resetTestingModule();
      const second = await setup();
      expect(second.service.active()).toEqual(mine);
    });
  });
});
