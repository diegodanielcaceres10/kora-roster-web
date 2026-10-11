import { TestBed } from '@angular/core/testing';
import { drawTeams } from '../core/draw-teams';
import { I18n } from '../i18n/i18n';
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
      [11, 'odd', false],
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
});
