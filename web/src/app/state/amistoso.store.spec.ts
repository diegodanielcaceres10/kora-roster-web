import { TestBed } from '@angular/core/testing';
import { Auth } from '../auth/auth';
import { drawTeams } from '../core/draw-teams';
import { DEFAULT_TEAM_ICONS } from '../core/format-teams';
import { I18n } from '../i18n/i18n';
import { PreferencesService } from '../preferences/preferences-service';
import { saveSession, TEST_PREFERENCES } from '../preferences/testing';
import { AmistosoStore } from './amistoso.store';

const list = (count: number) =>
  Array.from({ length: count }, (_, i) => `Player ${i + 1}`).join('\n');

// Small seeded generator so the draws in these tests are repeatable.
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function setup() {
  return { store: TestBed.inject(AmistosoStore), i18n: TestBed.inject(I18n) };
}

function inPreview(text: string) {
  const ctx = setup();
  ctx.store.setRawText(text);
  ctx.store.continueToPreview();
  return ctx;
}

describe('AmistosoStore', () => {
  afterEach(() => {
    document.documentElement.lang = 'en';
  });

  describe('initial state', () => {
    it('starts empty, on the paste step', () => {
      const { store } = setup();
      expect(store.step()).toBe('paste');
      expect(store.rawText()).toBe('');
      expect(store.players()).toEqual([]);
      expect(store.teams()).toBeNull();
      expect(store.whatsappText()).toBe('');
    });
  });

  describe('continueToPreview', () => {
    it('turns the pasted text into players and moves to the preview', () => {
      const { store } = inPreview('1. Diego 🧤\n2. Mati');
      expect(store.step()).toBe('preview');
      expect(store.players().map(({ name, isGoalkeeper }) => ({ name, isGoalkeeper }))).toEqual([
        { name: 'Diego', isGoalkeeper: true },
        { name: 'Mati', isGoalkeeper: false },
      ]);
    });

    it('gives every player its own id', () => {
      const { store } = inPreview(list(12));
      expect(new Set(store.players().map((p) => p.id)).size).toBe(12);
    });

    it.each([[''], ['   \n  '], ['1.'], ['- \n * ']])(
      'stays on the paste step when %j has no names',
      (text) => {
        const { store } = setup();
        store.setRawText(text);
        store.continueToPreview();
        expect(store.step()).toBe('paste');
        expect(store.players()).toEqual([]);
      },
    );

    it('keeps the edits made in the preview when the text did not change', () => {
      const { store } = inPreview('Diego\nMati');
      const diego = store.players()[0];
      store.renamePlayer(diego.id, 'Diego R.');
      store.removePlayer(store.players()[1].id);
      store.back();
      store.continueToPreview();
      expect(store.step()).toBe('preview');
      expect(store.players().map((p) => p.name)).toEqual(['Diego R.']);
    });

    it('reads the text again when it changed after going back', () => {
      const { store } = inPreview('Diego\nMati');
      store.renamePlayer(store.players()[0].id, 'Edited');
      store.back();
      store.setRawText('Nico\nFede\nLucho');
      store.continueToPreview();
      expect(store.players().map((p) => p.name)).toEqual(['Nico', 'Fede', 'Lucho']);
    });

    it('never reuses an id when the list is read again', () => {
      const { store } = inPreview('Diego\nMati');
      const first = store.players().map((p) => p.id);
      store.back();
      store.setRawText('Nico\nFede');
      store.continueToPreview();
      const second = store.players().map((p) => p.id);
      expect(second.some((id) => first.includes(id))).toBe(false);
    });
  });

  describe('back', () => {
    it('returns to the paste step and keeps the text', () => {
      const { store } = inPreview('Diego\nMati');
      store.back();
      expect(store.step()).toBe('paste');
      expect(store.rawText()).toBe('Diego\nMati');
    });
  });

  describe('editing the list', () => {
    it('renames a player by id and trims the name', () => {
      const { store } = inPreview('Diego\nMati');
      store.renamePlayer(store.players()[1].id, '  Matías  ');
      expect(store.players().map((p) => p.name)).toEqual(['Diego', 'Matías']);
    });

    it.each([[''], ['   ']])('does not accept the name %j', (name) => {
      const { store } = inPreview('Diego\nMati');
      store.renamePlayer(store.players()[0].id, name);
      expect(store.players().map((p) => p.name)).toEqual(['Diego', 'Mati']);
    });

    it('ignores an id that does not exist', () => {
      const { store } = inPreview('Diego\nMati');
      store.renamePlayer('nope', 'Other');
      store.removePlayer('nope');
      store.toggleGoalkeeper('nope');
      expect(store.players().map((p) => p.name)).toEqual(['Diego', 'Mati']);
    });

    it('removes only the chosen player', () => {
      const { store } = inPreview('Diego\nMati\nNico');
      store.removePlayer(store.players()[1].id);
      expect(store.players().map((p) => p.name)).toEqual(['Diego', 'Nico']);
    });

    it('flips the goalkeeper mark of only the chosen player, both ways', () => {
      const { store } = inPreview('Diego\nMati');
      const mati = store.players()[1].id;
      store.toggleGoalkeeper(mati);
      expect(store.players().map((p) => p.isGoalkeeper)).toEqual([false, true]);
      store.toggleGoalkeeper(mati);
      expect(store.players().map((p) => p.isGoalkeeper)).toEqual([false, false]);
    });
  });

  describe('validation of the player count', () => {
    it.each([
      [9, 'too-few', false],
      [10, null, true],
      [11, 'uneven', false],
      [12, null, true],
      [22, null, true],
      [23, 'too-many', false],
    ])('with %i players the error is %s and canDraw is %s', (count, error, canDraw) => {
      const { store } = inPreview(list(count));
      expect(store.playerCount()).toBe(count);
      expect(store.countError()).toBe(error);
      expect(store.canDraw()).toBe(canDraw);
    });

    it('follows the list as players are removed', () => {
      const { store } = inPreview(list(11));
      expect(store.canDraw()).toBe(false);
      store.removePlayer(store.players()[0].id);
      expect(store.canDraw()).toBe(true);
    });
  });

  describe('draw', () => {
    it('does nothing when the count is not valid', () => {
      const { store } = inPreview(list(11));
      store.draw();
      expect(store.step()).toBe('preview');
      expect(store.teams()).toBeNull();
    });

    it('moves to the result with two teams of half the players each, nobody lost', () => {
      const { store } = inPreview(list(12));
      store.draw(seeded(1));
      expect(store.step()).toBe('result');
      const [a, b] = store.teams() ?? [[], []];
      expect([a.length, b.length]).toEqual([6, 6]);
      expect([...a, ...b].map((p) => p.id).sort()).toEqual(
        store
          .players()
          .map((p) => p.id)
          .sort(),
      );
    });

    it('splits goalkeepers between the teams', () => {
      const { store } = inPreview('Diego 🧤\nMati 🧤\n' + list(10));
      store.draw(seeded(2));
      const [a, b] = store.teams() ?? [[], []];
      expect([a, b].map((t) => t.filter((p) => p.isGoalkeeper).length)).toEqual([1, 1]);
    });

    it('uses the random source it is given', () => {
      const { store } = inPreview(list(14));
      store.draw(seeded(7));
      const expected = drawTeams(store.players(), seeded(7));
      expect(expected.ok).toBe(true);
      if (expected.ok) expect(store.teams()).toEqual(expected.teams);
    });

    it('can draw again from the result and stays on the result', () => {
      const { store } = inPreview(list(12));
      store.draw(seeded(1));
      store.draw(seeded(99));
      expect(store.step()).toBe('result');
      const [a, b] = store.teams() ?? [[], []];
      expect(a.length + b.length).toBe(12);
    });
  });

  describe('whatsappText', () => {
    it('writes the teams with their icons and titles in the current language', () => {
      const { store, i18n } = inPreview('Diego 🧤\nMati 🧤\n' + list(10));
      store.draw(seeded(3));
      expect(store.whatsappText()).toContain('🔴 Team 1\n');
      expect(store.whatsappText()).toContain('🔵 Team 2\n');
      i18n.setLang('es');
      expect(store.whatsappText()).toContain('🔴 Equipo 1\n');
      i18n.setLang('pt');
      expect(store.whatsappText()).toContain('🔵 Time 2\n');
    });

    it('marks the goalkeepers with the glove', () => {
      const { store } = inPreview('Diego 🧤\nMati 🧤\n' + list(10));
      store.draw(seeded(3));
      expect(store.whatsappText().match(/🧤/g)).toHaveLength(2);
    });
  });

  describe('reset', () => {
    it('goes back to the initial state from the result', () => {
      const { store } = inPreview(list(12));
      store.draw(seeded(1));
      store.reset();
      expect(store.step()).toBe('paste');
      expect(store.rawText()).toBe('');
      expect(store.players()).toEqual([]);
      expect(store.teams()).toBeNull();
      expect(store.whatsappText()).toBe('');
    });
  });

  describe('with the preferences of the person who is signed in', () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    // preferences: undefined = signed in with nothing saved, null = nobody signed in.
    function drawn(preferences?: typeof TEST_PREFERENCES | null) {
      if (preferences !== null) saveSession(preferences);
      const ctx = inPreview('Diego 🧤\nMati 🧤\n' + list(10));
      ctx.store.draw(seeded(3));
      return ctx;
    }

    it('uses the icons of the person, and the default circles for everybody else', () => {
      expect(drawn(TEST_PREFERENCES).store.teamIcons().slice(0, 2)).toEqual(['🟢', '🟡']);
      TestBed.resetTestingModule();
      localStorage.clear();
      expect(drawn(null).store.teamIcons()).toEqual(DEFAULT_TEAM_ICONS);
    });

    it('writes the message with their header, icons, numbering and footer', () => {
      const { store } = drawn(TEST_PREFERENCES);
      const text = store.whatsappText();
      expect(text.startsWith('⚽ Amistoso\n\n🟢 Team 1\n1) ')).toBe(true);
      expect(text).toContain('\n\n🟡 Team 2\n1) ');
      expect(text.endsWith('\n\nConfirmen')).toBe(true);
      expect(text.match(/🧤/g)).toHaveLength(2);
    });

    it('keeps the titles of the teams in the language of the page', () => {
      const { store, i18n } = drawn(TEST_PREFERENCES);
      i18n.setLang('es');
      expect(store.whatsappText()).toContain('🟢 Equipo 1\n');
      expect(store.whatsappText()).toContain('🟡 Equipo 2\n');
    });

    it('looks like before for someone who is signed in but saved nothing', () => {
      const { store } = drawn(undefined);
      expect(store.whatsappText().startsWith('🔴 Team 1\n1. ')).toBe(true);
      expect(store.whatsappText()).toContain('\n\n🔵 Team 2\n1. ');
    });

    it('looks like before for somebody who is not signed in', () => {
      const { store } = drawn(null);
      expect(store.whatsappText().startsWith('🔴 Team 1\n1. ')).toBe(true);
      expect(store.whatsappText()).not.toContain('Confirmen');
    });

    it('uses new preferences as soon as they are saved', () => {
      const { store } = drawn(undefined);
      TestBed.inject(PreferencesService).save(TEST_PREFERENCES);
      expect(store.whatsappText().startsWith('⚽ Amistoso\n\n🟢 Team 1')).toBe(true);
    });

    it('goes back to the default look when the person signs out', async () => {
      const { store } = drawn(TEST_PREFERENCES);
      await TestBed.inject(Auth).signOut();
      expect(store.whatsappText().startsWith('🔴 Team 1\n1. ')).toBe(true);
      expect(store.teamIcons()).toEqual(DEFAULT_TEAM_ICONS);
    });

    describe('the team size the person usually plays', () => {
      it.each([
        [14, null],
        [12, { perTeam: 7, teams: 2, count: 12 }],
        [10, { perTeam: 7, teams: 2, count: 10 }],
        [22, { perTeam: 7, teams: 2, count: 22 }],
      ])('with %i players the mismatch is %j', (count, expected) => {
        saveSession(TEST_PREFERENCES);
        const { store } = inPreview(list(count));
        expect(store.sizeMismatch()).toEqual(expected);
      });

      it('is not a mismatch when the person allows any size', () => {
        saveSession({ ...TEST_PREFERENCES, playersPerTeam: null });
        expect(inPreview(list(12)).store.sizeMismatch()).toBeNull();
      });

      it('is not a mismatch for somebody who is not signed in', () => {
        expect(inPreview(list(12)).store.sizeMismatch()).toBeNull();
      });

      it('does not stop the draw, which only depends on the 10 to 22 even rule', () => {
        saveSession(TEST_PREFERENCES);
        const { store } = inPreview(list(12));
        expect(store.sizeMismatch()).not.toBeNull();
        expect(store.canDraw()).toBe(true);
      });
    });
  });

  describe('the number of teams', () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it('starts at 2', () => {
      expect(setup().store.teamCount()).toBe(2);
    });

    it('keeps somebody who is not signed in at 2 teams', () => {
      const { store } = setup();
      store.setTeamCount(3);
      store.setTeamCount(4);
      expect(store.teamCount()).toBe(2);
    });

    it.each([3, 4])('lets a signed in person choose %i teams', (count) => {
      saveSession();
      const { store } = setup();
      store.setTeamCount(count);
      expect(store.teamCount()).toBe(count);
    });

    it.each([5, 6])('does not let a free account choose %i teams, which is Premium', (count) => {
      saveSession();
      const { store } = setup();
      store.setTeamCount(count);
      expect(store.teamCount()).toBe(2);
    });

    it.each([0, 1, 7, 2.5, NaN, -3])('ignores %s as a number of teams', (count) => {
      saveSession();
      const { store } = setup();
      store.setTeamCount(4);
      store.setTeamCount(count);
      expect(store.teamCount()).toBe(4);
    });

    it('goes back to what the plan allows when the person signs out', async () => {
      saveSession();
      const { store } = setup();
      store.setTeamCount(4);
      await TestBed.inject(Auth).signOut();
      expect(store.teamCount()).toBe(2);
    });

    it('checks the player count for the chosen number of teams', () => {
      saveSession();
      const { store } = inPreview(list(14));
      expect(store.countError()).toBeNull();
      store.setTeamCount(3);
      expect(store.countError()).toBe('too-few');
      expect(store.canDraw()).toBe(false);
      store.setTeamCount(2);
      expect(store.canDraw()).toBe(true);
    });

    it.each([
      [3, 18],
      [4, 20],
    ])('draws %i teams of equal size', (teams, players) => {
      saveSession();
      const { store } = inPreview(list(players));
      store.setTeamCount(teams);
      store.draw(seeded(1));
      expect(store.teams()).toHaveLength(teams);
      expect(store.teams()?.map((team) => team.length)).toEqual(Array(teams).fill(players / teams));
    });

    it('does not draw a list that does not fit the chosen number of teams', () => {
      saveSession();
      const { store } = inPreview(list(14));
      store.setTeamCount(3);
      store.draw(seeded(1));
      expect(store.step()).toBe('preview');
      expect(store.teams()).toBeNull();
    });

    it('goes back to 2 teams with "start over"', () => {
      saveSession();
      const { store } = inPreview(list(20));
      store.setTeamCount(4);
      store.reset();
      expect(store.teamCount()).toBe(2);
    });

    it('writes every team in the message with its own icon and title', () => {
      saveSession();
      const { store } = inPreview(list(20));
      store.setTeamCount(4);
      store.draw(seeded(2));
      const text = store.whatsappText();
      ['🔴', '🔵', '🟢', '🟡'].forEach((icon, i) => {
        expect(text).toContain(`${icon} Team ${i + 1}\n`);
      });
    });

    it('compares the size the person usually plays with the number of teams in use', () => {
      saveSession({ ...TEST_PREFERENCES, playersPerTeam: 5 });
      const { store } = inPreview(list(20));
      expect(store.sizeMismatch()).toEqual({ perTeam: 5, teams: 2, count: 20 });
      store.setTeamCount(4);
      expect(store.sizeMismatch()).toBeNull();
    });
  });

  describe('the number of teams the person prefers', () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it('starts at the number of teams in their preferences', () => {
      saveSession({ ...TEST_PREFERENCES, teamCount: 4 });
      expect(setup().store.teamCount()).toBe(4);
    });

    it('keeps what they pick in the selector over their preference, until they start over', () => {
      saveSession({ ...TEST_PREFERENCES, teamCount: 4 });
      const { store } = setup();
      store.setTeamCount(3);
      expect(store.teamCount()).toBe(3);
      store.reset();
      expect(store.teamCount()).toBe(4);
    });

    it('never goes above what the plan allows, whatever was saved', () => {
      saveSession({ ...TEST_PREFERENCES, teamCount: 5 });
      expect(setup().store.teamCount()).toBe(4);
    });

    it('is 2 for somebody who is not signed in, even if preferences are saved in the browser', () => {
      localStorage.setItem(
        'kora:prefs:1122334455',
        JSON.stringify({ version: 2, preferences: { ...TEST_PREFERENCES, teamCount: 4 } }),
      );
      expect(setup().store.teamCount()).toBe(2);
    });

    it('follows new preferences while the person has picked nothing', () => {
      saveSession(TEST_PREFERENCES);
      const { store } = setup();
      TestBed.inject(PreferencesService).save({ ...TEST_PREFERENCES, teamCount: 3 });
      expect(store.teamCount()).toBe(3);
    });

    it('does not follow new preferences once the person picked a number in the selector', () => {
      saveSession(TEST_PREFERENCES);
      const { store } = setup();
      store.setTeamCount(4);
      TestBed.inject(PreferencesService).save({ ...TEST_PREFERENCES, teamCount: 3 });
      expect(store.teamCount()).toBe(4);
    });

    it('checks the size they usually play against the teams they prefer', () => {
      saveSession({ ...TEST_PREFERENCES, teamCount: 4, playersPerTeam: 5 });
      const { store } = inPreview(list(20));
      expect(store.sizeMismatch()).toBeNull();
      expect(store.countError()).toBeNull();
    });
  });

  describe('the colors of the teams', () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    const DEFAULTS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00'];

    it('are the default ones for somebody who is not signed in', () => {
      expect(setup().store.teamColors()).toEqual(DEFAULTS);
    });

    it('are the default ones for somebody signed in who saved nothing', () => {
      saveSession();
      expect(setup().store.teamColors()).toEqual(DEFAULTS);
    });

    it('are the ones the person chose, team by team', () => {
      saveSession(TEST_PREFERENCES);
      expect(setup().store.teamColors()).toEqual(TEST_PREFERENCES.teams.map((team) => team.color));
    });

    it('go back to the default ones when the person signs out', async () => {
      saveSession(TEST_PREFERENCES);
      const { store } = setup();
      await TestBed.inject(Auth).signOut();
      expect(store.teamColors()).toEqual(DEFAULTS);
    });
  });
});
