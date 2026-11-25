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

  it.each([
    ['1 Jugador 1', 'Jugador 1'],
    ['10 Jugador 10', 'Jugador 10'],
    ['16 Jugador 16 B', 'Jugador 16 B'],
    ['7   Jugador 7', 'Jugador 7'],
    ['5\tJugador 5 C', 'Jugador 5 C'],
    ['  12 Jugador 12  ', 'Jugador 12'],
  ])('strips a number followed only by a space: %j', (input, expected) => {
    expect(names(input)).toEqual([expected]);
  });

  it.each([['Diego 2'], ['21:30 Cancha'], ['1.5 Litros'], ['7']])(
    'keeps digits that are part of the text: %j',
    (input) => {
      expect(names(input)).toEqual([input]);
    },
  );

  it('strips only the first number, so a number in the name stays', () => {
    expect(names('3 Diego 2')).toEqual(['Diego 2']);
  });

  it('keeps the emojis after the name when the number is removed', () => {
    expect(names('8 Jugador 8 ⚽❤️⚽\n9 Jugador 9 💙💛\n10 Jugador 10 💙💛💙')).toEqual([
      'Jugador 8 ⚽❤️⚽',
      'Jugador 9 💙💛',
      'Jugador 10 💙💛💙',
    ]);
  });

  it('cleans a list numbered with a bare number, as it is copied from a chat', () => {
    const raw = [
      '1 Jugador 1',
      '2 Jugador 2',
      '3 Jugador 3 ',
      '4 Jugador 4 ',
      '5 Jugador 5 C',
      '6 Jugador 6 ',
      '7 Jugador 7 ',
      '8 Jugador 8 ⚽❤️⚽',
      '9 Jugador 9 💙💛',
      '10 Jugador 10 💙💛💙',
      '11 Jugador 11',
      '12 Jugador 12 ',
      '13 jugador 13',
      '14 Jugador 14',
      '15 Jugador 15 D',
      '16 Jugador 16 Apellido',
    ].join('\n');
    expect(names(raw)).toEqual([
      'Jugador 1',
      'Jugador 2',
      'Jugador 3',
      'Jugador 4',
      'Jugador 5 C',
      'Jugador 6',
      'Jugador 7',
      'Jugador 8 ⚽❤️⚽',
      'Jugador 9 💙💛',
      'Jugador 10 💙💛💙',
      'Jugador 11',
      'Jugador 12',
      'jugador 13',
      'Jugador 14',
      'Jugador 15 D',
      'Jugador 16 Apellido',
    ]);
  });

  it('still flags the goalkeeper when the line starts with a bare number', () => {
    expect(keepers('1 Jugador 1 (arquero)\n2 Jugador 2')).toEqual(['Jugador 1']);
    expect(keepers('1 🧤 Jugador 1\n2 Jugador 2')).toEqual(['Jugador 1']);
  });

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

  it.each([['*'], ['* '], ['- \n * ']])('ignores lines that hold only a bullet: %j', (input) => {
    expect(names(input)).toEqual([]);
  });

  it('skips empty bullet lines between names', () => {
    expect(names('- Diego\n*\n- Mati')).toEqual(['Diego', 'Mati']);
  });

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
