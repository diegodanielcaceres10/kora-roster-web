import { parsePastedNames } from './parse-players';

const names = (raw: string) => parsePastedNames(raw).map((p) => p.name);
const keepers = (raw: string) =>
  parsePastedNames(raw)
    .filter((p) => p.isGoalkeeper)
    .map((p) => p.name);

const KEYCAP_1 = '1\uFE0F\u20E3';
const KEYCAP_4 = '4\uFE0F\u20E3';
const KEYCAP_10 = '1\uFE0F\u20E30\uFE0F\u20E3';
const KEYCAP_TEN = '\u{1F51F}';

describe('parsePastedNames', () => {
  it('returns nothing for empty or blank input', () => {
    expect(parsePastedNames('')).toEqual([]);
    expect(parsePastedNames('   \n  ')).toEqual([]);
  });

  it.each([
    ['1. Diego', 'Diego'],
    ['1) Diego', 'Diego'],
    ['1.Diego', 'Diego'],
    ['- Diego', 'Diego'],
    ['• Diego', 'Diego'],
    ['* Diego', 'Diego'],
    ['– Diego', 'Diego'],
  ])('strips the list marker from %j', (input, expected) => {
    expect(names(input)).toEqual([expected]);
  });

  it.each([
    ['1- Diego', 'Diego'],
    ['2 - Mati', 'Mati'],
    ['3 – Nico', 'Nico'],
    ['4 — Fede', 'Fede'],
    ['5: Lucho', 'Lucho'],
  ])('strips numbering that uses a dash or a colon: %j', (input, expected) => {
    expect(names(input)).toEqual([expected]);
  });

  it.each([
    [`${KEYCAP_1} Diego`, 'Diego'],
    [`${KEYCAP_10} Mati`, 'Mati'],
    [`${KEYCAP_TEN} Nico`, 'Nico'],
  ])('strips emoji numbering: %j', (input, expected) => {
    expect(names(input)).toEqual([expected]);
  });

  it.each([['10 Diego'], ['Diego 2'], ['21:30 Cancha']])(
    'keeps digits that are part of the text: %j',
    (input) => {
      expect(names(input)).toEqual([input]);
    },
  );

  it('splits on new lines, commas and semicolons', () => {
    expect(names('1. Diego, 2. Mati; 3. Nico\nFede')).toEqual(['Diego', 'Mati', 'Nico', 'Fede']);
  });

  it('ignores blank lines and collapses extra spaces', () => {
    expect(names('\n  \n  Diego   Pérez  \n')).toEqual(['Diego Pérez']);
  });

  it.each([
    'arquero',
    'portero',
    'guardameta',
    'goleiro',
    'goleira',
    'goalkeeper',
    'goalkeper',
    'goalie',
    'gk',
    'ARQUERO',
    'Gk',
  ])('reads "(%s)" as a goalkeeper and removes it from the name', (word) => {
    expect(parsePastedNames(`Diego (${word})`)).toEqual([{ name: 'Diego', isGoalkeeper: true }]);
  });

  it('accepts spaces inside the parentheses of the marker', () => {
    expect(parsePastedNames('Diego ( GK )')).toEqual([{ name: 'Diego', isGoalkeeper: true }]);
  });

  it.each([['Diego 🧤'], ['🧤 Diego'], ['Diego (🧤)'], ['Diego🧤']])(
    'reads the glove emoji as a goalkeeper and removes it: %j',
    (input) => {
      expect(parsePastedNames(input)).toEqual([{ name: 'Diego', isGoalkeeper: true }]);
    },
  );

  it('does not flag players without a marker', () => {
    expect(keepers('1. Diego\n2. Mati (gk)\n3. Nico')).toEqual(['Mati']);
  });

  it.each([['*Diego*'], ['*1. Diego*'], ['- *Diego*'], ['*Diego (arquero)*']])(
    'unwraps WhatsApp bold around a name: %j',
    (input) => {
      expect(names(input)).toEqual(['Diego']);
    },
  );

  it('keeps an asterisk that is not a bullet and not a pair', () => {
    expect(names('*Diego')).toEqual(['*Diego']);
  });

  it('removes duplicates ignoring case, keeping the first spelling and position', () => {
    expect(names('Diego\nMati\ndiego\nDIEGO')).toEqual(['Diego', 'Mati']);
  });

  it('keeps the goalkeeper mark when a duplicate carries it', () => {
    expect(parsePastedNames('Diego\nMati\nDiego (arquero)')).toEqual([
      { name: 'Diego', isGoalkeeper: true },
      { name: 'Mati', isGoalkeeper: false },
    ]);
  });

  it('cleans a realistic pasted list', () => {
    const pasted = [
      '1. Diego 🧤',
      '2) Mati',
      '3- Nico (GK)',
      `${KEYCAP_4} Fede, Lucho; Santi`,
      '- *Gonza*',
    ].join('\n');
    expect(parsePastedNames(pasted)).toEqual([
      { name: 'Diego', isGoalkeeper: true },
      { name: 'Mati', isGoalkeeper: false },
      { name: 'Nico', isGoalkeeper: true },
      { name: 'Fede', isGoalkeeper: false },
      { name: 'Lucho', isGoalkeeper: false },
      { name: 'Santi', isGoalkeeper: false },
      { name: 'Gonza', isGoalkeeper: false },
    ]);
  });
});
