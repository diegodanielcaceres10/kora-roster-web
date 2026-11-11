import { TestBed } from '@angular/core/testing';
import { Auth } from '../auth/auth';
import { drawTeams } from '../core/draw-teams';
import { DEFAULT_TEAM_ICONS } from '../core/format-teams';
import { I18n } from '../i18n/i18n';
import { PreferencesService } from '../preferences/preferences-service';
import { saveSession, TEST_PREFERENCES } from '../preferences/testing';
import { AmistosoStore, Player } from './amistoso.store';

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

    describe('from the teams', () => {
      it('returns to the preview, with the list as it was edited', () => {
        const { store } = inPreview(list(12));
        store.renamePlayer(store.players()[0].id, 'Nico');
        store.draw(seeded(3));
        store.back();
        expect(store.step()).toBe('preview');
        expect(store.players()).toHaveLength(12);
        expect(store.players()[0].name).toBe('Nico');
        expect(store.rawText()).toBe(list(12));
      });

      it('leaves the teams behind, so the list can be changed and drawn again', () => {
        const { store } = inPreview(list(12));
        store.draw(seeded(3));
        store.back();
        expect(store.teams()).toBeNull();
        expect(store.whatsappText()).toBe('');
        store.draw(seeded(4));
        expect(store.step()).toBe('result');
        expect(store.teams()).not.toBeNull();
      });

      it('also leaves behind the players who had no team', () => {
        saveSession();
        const { store } = inPreview(list(12));
        store.startManual();
        store.movePlayer(store.pool()[0].id, 0);
        store.back();
        expect(store.pool()).toEqual([]);
        expect(store.teams()).toBeNull();
      });

      it('goes one more step back to the paste step on the next time', () => {
        const { store } = inPreview(list(12));
        store.draw(seeded(3));
        store.back();
        store.back();
        expect(store.step()).toBe('paste');
        expect(store.rawText()).toBe(list(12));
      });
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

  describe('swapping two players', () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    // teams: undefined = 2 teams. More than 2 needs an account.
    function drawn(teams?: number) {
      if (teams && teams > 2) saveSession();
      const players =
        teams === 3
          ? 'Diego 🧤\nMati 🧤\nFede 🧤\n' + list(15)
          : teams === 4
            ? 'Diego 🧤\nMati 🧤\nFede 🧤\n' + list(17)
            : 'Diego 🧤\nMati 🧤\n' + list(10);
      const ctx = inPreview(players);
      if (teams) ctx.store.setTeamCount(teams);
      ctx.store.draw(seeded(3));
      return ctx;
    }
    const ownerOf = (teams: Player[][], id: string) =>
      teams.findIndex((team) => team.some((p) => p.id === id));
    const field = (team: Player[]) => team.find((p) => !p.isGoalkeeper) as Player;
    // What a swap must give: the player who comes takes the place of the one who goes, and
    // the goalkeepers stay first, keeping the order of everybody else.
    const expectedTeam = (team: Player[], out: Player, into: Player) => {
      const replaced = team.map((p) => (p.id === out.id ? into : p));
      return [
        ...replaced.filter((p) => p.isGoalkeeper),
        ...replaced.filter((p) => !p.isGoalkeeper),
      ];
    };

    it('moves each player to the team of the other, and changes nothing else', () => {
      const { store } = drawn();
      const before = store.teams() as Player[][];
      const a = field(before[0]);
      const b = field(before[1]);
      store.swapPlayers(a.id, b.id);
      const after = store.teams() as Player[][];
      expect(ownerOf(after, a.id)).toBe(1);
      expect(ownerOf(after, b.id)).toBe(0);
      expect(after.map((team) => team.length)).toEqual(before.map((team) => team.length));
      for (const player of before.flat().filter((p) => p.id !== a.id && p.id !== b.id)) {
        expect(ownerOf(after, player.id), player.name).toBe(ownerOf(before, player.id));
      }
    });

    it.each([3, 4])('works with %i teams, keeping every team the same size', (count) => {
      const { store } = drawn(count);
      const before = store.teams() as Player[][];
      const a = field(before[0]);
      const b = field(before[count - 1]);
      store.swapPlayers(a.id, b.id);
      const after = store.teams() as Player[][];
      expect(ownerOf(after, a.id)).toBe(count - 1);
      expect(ownerOf(after, b.id)).toBe(0);
      expect(after.map((team) => team.length)).toEqual(before.map((team) => team.length));
    });

    it('puts the player who comes in the place of the one who goes, goalkeepers first', () => {
      const { store } = drawn();
      const [x, y] = store.teams() as Player[][];
      // Every pair: goalkeeper with goalkeeper, with a field player, and field with field.
      for (const a of x) {
        for (const b of y) {
          store.draw(seeded(3));
          store.swapPlayers(a.id, b.id);
          const [afterX, afterY] = store.teams() as Player[][];
          expect(afterX, `${a.name} and ${b.name}`).toEqual(expectedTeam(x, a, b));
          expect(afterY, `${a.name} and ${b.name}`).toEqual(expectedTeam(y, b, a));
        }
      }
    });

    it('leaves the goalkeepers at the start of both teams', () => {
      const { store } = drawn();
      const [x, y] = store.teams() as Player[][];
      const keeper = x.find((p) => p.isGoalkeeper) as Player;
      store.swapPlayers(keeper.id, field(y).id);
      for (const team of store.teams() as Player[][]) {
        const flags = team.map((p) => p.isGoalkeeper);
        expect(flags).toEqual([...flags].sort((p, q) => Number(q) - Number(p)));
      }
    });

    it('does nothing with two players of the same team', () => {
      const { store } = drawn();
      const before = store.teams();
      const [x] = before as Player[][];
      store.swapPlayers(x[0].id, x[1].id);
      expect(store.teams()).toBe(before);
    });

    it('does nothing with the same player twice', () => {
      const { store } = drawn();
      const before = store.teams();
      store.swapPlayers((before as Player[][])[0][0].id, (before as Player[][])[0][0].id);
      expect(store.teams()).toBe(before);
    });

    it('does nothing when a player does not exist', () => {
      const { store } = drawn();
      const before = store.teams();
      const known = (before as Player[][])[0][0].id;
      store.swapPlayers(known, 'nobody');
      store.swapPlayers('nobody', known);
      store.swapPlayers('nobody', 'nobody-else');
      expect(store.teams()).toBe(before);
    });

    it('does nothing before there are teams', () => {
      const { store } = inPreview(list(12));
      store.swapPlayers('p1', 'p2');
      expect(store.teams()).toBeNull();
      expect(store.step()).toBe('preview');
    });

    it('does not change the lists it had before', () => {
      const { store } = drawn();
      const before = store.teams() as Player[][];
      const snapshot = before.map((team) => [...team]);
      store.swapPlayers(field(before[0]).id, field(before[1]).id);
      expect(before).toEqual(snapshot);
    });

    it('updates the text for WhatsApp, each name under its new team', () => {
      const { store } = drawn();
      const [x, y] = store.teams() as Player[][];
      const a = field(x);
      const b = field(y);
      store.swapPlayers(a.id, b.id);
      const [first, second] = store.whatsappText().split('\n\n');
      expect(first).toContain(b.name);
      expect(first).not.toContain(a.name);
      expect(second).toContain(a.name);
      expect(second).not.toContain(b.name);
    });

    it('is undone by drawing again, which starts from the same teams', () => {
      const { store } = drawn();
      const original = store.teams();
      const [x, y] = original as Player[][];
      store.swapPlayers(field(x).id, field(y).id);
      expect(store.teams()).not.toEqual(original);
      store.draw(seeded(3));
      expect(store.teams()).toEqual(original);
    });
  });

  describe('what the story image is made from', () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    const DEFAULTS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00'];
    const drawn = () => {
      const ctx = inPreview('Diego 🧤\nMati 🧤\n' + list(10));
      ctx.store.draw(seeded(3));
      return ctx;
    };

    it('is nothing until the teams are drawn', () => {
      expect(inPreview(list(12)).store.storyInput()).toBeNull();
    });

    it('gives each team its title, its color and its players, and nothing else about them', () => {
      const { store } = drawn();
      const input = store.storyInput();
      const teams = store.teams() as Player[][];
      expect(input?.teams.map((team) => team.title)).toEqual(['Team 1', 'Team 2']);
      expect(input?.teams.map((team) => team.color)).toEqual(DEFAULTS.slice(0, 2));
      expect(input?.teams[0].players).toEqual(
        teams[0].map((p) => ({ name: p.name, isGoalkeeper: p.isGoalkeeper })),
      );
      expect(Object.keys(input?.teams[0] ?? {}).sort()).toEqual(['color', 'players', 'title']);
    });

    it('is plain for somebody who is not signed in: no header, no footer, dotted numbers', () => {
      const input = drawn().store.storyInput();
      expect([input?.header, input?.footer, input?.numbering]).toEqual(['', '', 'dot']);
    });

    it('uses the header, footer, numbering and colors of the person who is signed in', () => {
      saveSession({ ...TEST_PREFERENCES, numbering: 'dash' });
      const input = drawn().store.storyInput();
      expect([input?.header, input?.footer, input?.numbering]).toEqual([
        '⚽ Amistoso',
        'Confirmen',
        'dash',
      ]);
      expect(input?.teams.map((team) => team.color)).toEqual(['#00ff00', '#ffff00']);
    });

    it('has a block for each team in use, and the titles follow the language', () => {
      saveSession();
      const { store, i18n } = inPreview('Diego 🧤\nMati 🧤\nFede 🧤\n' + list(15));
      store.setTeamCount(3);
      store.draw(seeded(3));
      i18n.setLang('es');
      expect(store.storyInput()?.teams.map((team) => team.title)).toEqual([
        'Equipo 1',
        'Equipo 2',
        'Equipo 3',
      ]);
    });

    it('follows the players when two of them are swapped', () => {
      const { store } = drawn();
      const [x, y] = store.teams() as Player[][];
      const a = x.find((p) => !p.isGoalkeeper) as Player;
      const b = y.find((p) => !p.isGoalkeeper) as Player;
      store.swapPlayers(a.id, b.id);
      const names = store.storyInput()?.teams.map((team) => team.players.map((p) => p.name));
      expect(names?.[0]).toContain(b.name);
      expect(names?.[1]).toContain(a.name);
    });
  });

  describe('manual assignment', () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    // 12 players with two goalkeepers; 18 for three teams. More than 2 teams needs an account,
    // and so does the manual assignment, so everybody here has signed in.
    function manual(teams?: number) {
      saveSession();
      const ctx = inPreview('Diego 🧤\nMati 🧤\n' + list(teams === 3 ? 16 : 10));
      if (teams) ctx.store.setTeamCount(teams);
      ctx.store.startManual();
      return ctx;
    }
    const teamsOf = (store: ReturnType<typeof setup>['store']) => store.teams() as Player[][];
    const idsOf = (players: Player[]) => players.map((p) => p.id);

    describe('startManual', () => {
      it('opens the teams, all of them empty, with everybody waiting without a team', () => {
        const { store } = manual();
        expect(store.step()).toBe('result');
        expect(teamsOf(store)).toEqual([[], []]);
        expect(idsOf(store.pool()).sort()).toEqual(idsOf(store.players()).sort());
      });

      it('has as many empty teams as the person chose', () => {
        const { store } = manual(3);
        expect(teamsOf(store)).toEqual([[], [], []]);
        expect(store.pool()).toHaveLength(18);
      });

      it('lists the goalkeepers first among those without a team', () => {
        const { store } = manual();
        expect(
          store
            .pool()
            .map((p) => p.isGoalkeeper)
            .slice(0, 2),
        ).toEqual([true, true]);
        expect(
          store
            .pool()
            .slice(2)
            .every((p) => !p.isGoalkeeper),
        ).toBe(true);
      });

      it('does nothing without an account', () => {
        const ctx = inPreview('Diego 🧤\nMati 🧤\n' + list(10));
        ctx.store.startManual();
        expect(ctx.store.step()).toBe('preview');
        expect(ctx.store.teams()).toBeNull();
        expect(ctx.store.pool()).toEqual([]);
      });

      it('does nothing when the number of players is not valid for the teams', () => {
        saveSession();
        const { store } = inPreview(list(11));
        store.startManual();
        expect(store.step()).toBe('preview');
        expect(store.teams()).toBeNull();
        expect(store.pool()).toEqual([]);
      });
    });

    describe('the size of a team', () => {
      it('is the number of players divided by the number of teams', () => {
        expect(manual().store.teamSize()).toBe(6);
        TestBed.resetTestingModule();
        localStorage.clear();
        expect(manual(3).store.teamSize()).toBe(6);
      });

      it('is not known while the number of players is not valid', () => {
        const { store } = inPreview(list(11));
        expect(store.teamSize()).toBeNull();
      });
    });

    describe('without a team', () => {
      it('is empty after a draw, and the draw is complete', () => {
        saveSession();
        const { store } = inPreview('Diego 🧤\nMati 🧤\n' + list(10));
        store.draw(seeded(3));
        expect(store.pool()).toEqual([]);
        expect(store.isComplete()).toBe(true);
      });

      it('is emptied when the person goes back to the preview with the same list', () => {
        const { store } = manual();
        store.continueToPreview();
        expect(store.pool()).toEqual([]);
        expect(store.teams()).toBeNull();
      });

      it('is emptied when the person starts again', () => {
        const { store } = manual();
        store.reset();
        expect(store.pool()).toEqual([]);
        expect(store.teams()).toBeNull();
      });

      it('is emptied when a new draw is made after a manual start', () => {
        const { store } = manual();
        store.draw(seeded(3));
        expect(store.pool()).toEqual([]);
      });
    });

    describe('movePlayer', () => {
      it('puts a player who has no team into a team', () => {
        const { store } = manual();
        const [diego] = store.pool();
        store.movePlayer(diego.id, 0);
        expect(teamsOf(store)[0]).toEqual([diego]);
        expect(store.pool()).toHaveLength(11);
        expect(store.pool()).not.toContain(diego);
      });

      it('takes a player out of a team and leaves them without one', () => {
        const { store } = manual();
        const [diego] = store.pool();
        store.movePlayer(diego.id, 1);
        store.movePlayer(diego.id, 'pool');
        expect(teamsOf(store)[1]).toEqual([]);
        expect(store.pool()).toContain(diego);
      });

      it('moves a player from one team to another that has room', () => {
        const { store } = manual();
        const [diego] = store.pool();
        store.movePlayer(diego.id, 0);
        store.movePlayer(diego.id, 1);
        expect(teamsOf(store)[0]).toEqual([]);
        expect(teamsOf(store)[1]).toEqual([diego]);
      });

      it('does not put a seventh player into a team of six', () => {
        const { store } = manual();
        const everybody = [...store.pool()];
        everybody.slice(0, 6).forEach((p) => store.movePlayer(p.id, 0));
        store.movePlayer(everybody[6].id, 0);
        expect(teamsOf(store)[0]).toHaveLength(6);
        expect(store.pool()).toContain(everybody[6]);
      });

      it('does not move a player who is already where they are asked to go', () => {
        const { store } = manual();
        const [diego, mati] = store.pool();
        store.movePlayer(diego.id, 0);
        store.movePlayer(diego.id, 0);
        store.movePlayer(mati.id, 'pool');
        expect(teamsOf(store)[0]).toEqual([diego]);
        expect(store.pool()).toHaveLength(11);
      });

      it.each([[-1], [2], [1.5], [Number.NaN]])(
        'ignores the team %s, which does not exist',
        (to) => {
          const { store } = manual();
          const before = structuredClone({ teams: store.teams(), pool: store.pool() });
          store.movePlayer(store.pool()[0].id, to);
          expect({ teams: store.teams(), pool: store.pool() }).toEqual(before);
        },
      );

      it('ignores a player who does not exist', () => {
        const { store } = manual();
        const before = structuredClone({ teams: store.teams(), pool: store.pool() });
        store.movePlayer('nobody', 0);
        store.movePlayer('nobody', 'pool');
        expect({ teams: store.teams(), pool: store.pool() }).toEqual(before);
      });

      it('does nothing before the teams exist', () => {
        const { store } = inPreview(list(12));
        store.movePlayer(store.players()[0].id, 0);
        expect(store.teams()).toBeNull();
        expect(store.pool()).toEqual([]);
      });

      it('keeps the goalkeepers first in the team they go to and among those without a team', () => {
        const { store } = manual();
        const keepers = store.pool().filter((p) => p.isGoalkeeper);
        const fieldPlayers = store.pool().filter((p) => !p.isGoalkeeper);
        store.movePlayer(fieldPlayers[0].id, 0);
        store.movePlayer(keepers[0].id, 0);
        expect(teamsOf(store)[0].map((p) => p.isGoalkeeper)).toEqual([true, false]);
        store.movePlayer(keepers[0].id, 'pool');
        store.movePlayer(fieldPlayers[0].id, 'pool');
        expect(
          store
            .pool()
            .map((p) => p.isGoalkeeper)
            .slice(0, 2),
        ).toEqual([true, true]);
      });
    });

    describe('isComplete', () => {
      it('is false before the teams exist', () => {
        const { store } = inPreview(list(12));
        expect(store.isComplete()).toBe(false);
      });

      it('is false while somebody is without a team, and true once everybody has one', () => {
        const { store } = manual();
        const everybody = [...store.pool()];
        expect(store.isComplete()).toBe(false);
        everybody.forEach((p, i) => store.movePlayer(p.id, i % 2));
        expect(teamsOf(store).map((team) => team.length)).toEqual([6, 6]);
        expect(store.isComplete()).toBe(true);
      });

      it('goes back to false when somebody is taken out of a team', () => {
        const { store } = manual();
        const everybody = [...store.pool()];
        everybody.forEach((p, i) => store.movePlayer(p.id, i % 2));
        store.movePlayer(everybody[0].id, 'pool');
        expect(store.isComplete()).toBe(false);
      });
    });

    describe('drawRemaining', () => {
      it('puts everybody without a team into a team, and keeps those who were placed', () => {
        const { store } = manual();
        const [diego, mati] = store.pool();
        store.movePlayer(diego.id, 0);
        store.movePlayer(mati.id, 1);
        store.drawRemaining(seeded(3));
        expect(store.pool()).toEqual([]);
        expect(teamsOf(store).map((team) => team.length)).toEqual([6, 6]);
        expect(teamsOf(store)[0]).toContain(diego);
        expect(teamsOf(store)[1]).toContain(mati);
        expect(store.isComplete()).toBe(true);
      });

      it('does not lose or repeat anybody', () => {
        const { store } = manual(3);
        store.movePlayer(store.pool()[5].id, 2);
        store.drawRemaining(seeded(8));
        expect(idsOf(teamsOf(store).flat()).sort()).toEqual(idsOf(store.players()).sort());
      });

      it.each([1, 2, 3, 4, 5])(
        'gives one goalkeeper to each team when both are without a team (seed %i)',
        (seed) => {
          const { store } = manual();
          store.drawRemaining(seeded(seed));
          expect(teamsOf(store).map((team) => team.filter((p) => p.isGoalkeeper).length)).toEqual([
            1, 1,
          ]);
        },
      );

      it('keeps the goalkeepers first in every team', () => {
        const { store } = manual();
        store.drawRemaining(seeded(4));
        for (const team of teamsOf(store)) {
          expect(team[0].isGoalkeeper).toBe(true);
        }
      });

      it('does nothing when nobody is without a team', () => {
        saveSession();
        const { store } = inPreview('Diego 🧤\nMati 🧤\n' + list(10));
        store.draw(seeded(3));
        const before = structuredClone(store.teams());
        store.drawRemaining(seeded(5));
        expect(store.teams()).toEqual(before);
      });

      it('does nothing before the teams exist', () => {
        const { store } = inPreview(list(12));
        store.drawRemaining(seeded(5));
        expect(store.teams()).toBeNull();
        expect(store.pool()).toEqual([]);
      });
    });

    describe('clearTeams', () => {
      it('sends everybody back to being without a team, and keeps the empty teams', () => {
        saveSession();
        const { store } = inPreview('Diego 🧤\nMati 🧤\n' + list(10));
        store.draw(seeded(3));
        store.clearTeams();
        expect(teamsOf(store)).toEqual([[], []]);
        expect(idsOf(store.pool()).sort()).toEqual(idsOf(store.players()).sort());
        expect(
          store
            .pool()
            .map((p) => p.isGoalkeeper)
            .slice(0, 2),
        ).toEqual([true, true]);
        expect(store.step()).toBe('result');
        expect(store.isComplete()).toBe(false);
      });

      it('does nothing before the teams exist', () => {
        const { store } = inPreview(list(12));
        store.clearTeams();
        expect(store.teams()).toBeNull();
        expect(store.pool()).toEqual([]);
      });
    });

    describe('swapping with somebody who has no team', () => {
      it('puts each of the two where the other was, and keeps every size', () => {
        const { store } = manual();
        const everybody = [...store.pool()];
        const inTeam = everybody.find((p) => !p.isGoalkeeper) as Player;
        store.movePlayer(inTeam.id, 0);
        const waiting = store.pool().find((p) => !p.isGoalkeeper) as Player;
        store.swapPlayers(inTeam.id, waiting.id);
        expect(teamsOf(store)[0]).toEqual([waiting]);
        expect(store.pool()).toContain(inTeam);
        expect(store.pool()).not.toContain(waiting);
        expect(store.pool()).toHaveLength(11);
      });

      it('works whichever of the two is named first', () => {
        const { store } = manual();
        const inTeam = store.pool().find((p) => !p.isGoalkeeper) as Player;
        store.movePlayer(inTeam.id, 1);
        const waiting = store.pool().find((p) => !p.isGoalkeeper) as Player;
        store.swapPlayers(waiting.id, inTeam.id);
        expect(teamsOf(store)[1]).toEqual([waiting]);
        expect(store.pool()).toContain(inTeam);
      });

      it('keeps the goalkeepers first in the team and among those without a team', () => {
        const { store } = manual();
        const [diego] = store.pool();
        const fieldPlayer = store.pool().find((p) => !p.isGoalkeeper) as Player;
        store.movePlayer(fieldPlayer.id, 0);
        store.swapPlayers(fieldPlayer.id, diego.id);
        expect(teamsOf(store)[0]).toEqual([diego]);
        // Mati is the only goalkeeper left without a team, and the player who left the team
        // joins the others after him.
        expect(store.pool()[0].isGoalkeeper).toBe(true);
        expect(
          store
            .pool()
            .slice(1)
            .every((p) => !p.isGoalkeeper),
        ).toBe(true);
        expect(store.pool()).toContain(fieldPlayer);
      });

      it('does nothing between two players who are both without a team', () => {
        const { store } = manual();
        const before = structuredClone({ teams: store.teams(), pool: store.pool() });
        store.swapPlayers(store.pool()[0].id, store.pool()[1].id);
        expect({ teams: store.teams(), pool: store.pool() }).toEqual(before);
      });

      it('still swaps two players of different teams', () => {
        const { store } = manual();
        const [a, b] = store.pool().filter((p) => !p.isGoalkeeper);
        store.movePlayer(a.id, 0);
        store.movePlayer(b.id, 1);
        store.swapPlayers(a.id, b.id);
        expect(teamsOf(store)[0]).toEqual([b]);
        expect(teamsOf(store)[1]).toEqual([a]);
      });
    });
  });
});
