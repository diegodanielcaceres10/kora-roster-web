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
    ['1. Jugador A', 'Jugador A'],
    ['1) Jugador A', 'Jugador A'],
    ['1.Jugador A', 'Jugador A'],
    ['- Jugador A', 'Jugador A'],
    ['• Jugador A', 'Jugador A'],
    ['* Jugador A', 'Jugador A'],
    ['– Jugador A', 'Jugador A'],
  ])('strips the list marker from %j', (input, expected) => {
    expect(names(input)).toEqual([expected]);
  });

  it.each([
    ['1- Jugador A', 'Jugador A'],
    ['2 - Jugador E', 'Jugador E'],
    ['3 – Jugador G', 'Jugador G'],
    ['4 — Jugador B', 'Jugador B'],
    ['5: Jugador D', 'Jugador D'],
  ])('strips numbering that uses a dash or a colon: %j', (input, expected) => {
    expect(names(input)).toEqual([expected]);
  });

  it.each([
    [`${KEYCAP_1} Jugador A`, 'Jugador A'],
    [`${KEYCAP_10} Jugador E`, 'Jugador E'],
    [`${KEYCAP_TEN} Jugador G`, 'Jugador G'],
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

  it.each([['Jugador A 2'], ['21:30 Cancha'], ['1.5 Litros'], ['7']])(
    'keeps digits that are part of the text: %j',
    (input) => {
      expect(names(input)).toEqual([input]);
    },
  );

  it('strips only the first number, so a number in the name stays', () => {
    expect(names('3 Jugador A 2')).toEqual(['Jugador A 2']);
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
    expect(names('1. Jugador A, 2. Jugador E; 3. Jugador G\nJugador B')).toEqual([
      'Jugador A',
      'Jugador E',
      'Jugador G',
      'Jugador B',
    ]);
  });

  it('ignores blank lines and collapses extra spaces', () => {
    expect(names('\n  \n  Jugador A   Pérez  \n')).toEqual(['Jugador A Pérez']);
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
    expect(parsePastedNames(`Jugador A (${word})`)).toEqual([
      { name: 'Jugador A', isGoalkeeper: true },
    ]);
  });

  it('accepts spaces inside the parentheses of the marker', () => {
    expect(parsePastedNames('Jugador A ( GK )')).toEqual([
      { name: 'Jugador A', isGoalkeeper: true },
    ]);
  });

  it.each([['Jugador A 🧤'], ['🧤 Jugador A'], ['Jugador A (🧤)'], ['Jugador A🧤']])(
    'reads the glove emoji as a goalkeeper and removes it: %j',
    (input) => {
      expect(parsePastedNames(input)).toEqual([{ name: 'Jugador A', isGoalkeeper: true }]);
    },
  );

  it('does not flag players without a marker', () => {
    expect(keepers('1. Jugador A\n2. Jugador E (gk)\n3. Jugador G')).toEqual(['Jugador E']);
  });

  it.each([['*Jugador A*'], ['*1. Jugador A*'], ['- *Jugador A*'], ['*Jugador A (arquero)*']])(
    'unwraps WhatsApp bold around a name: %j',
    (input) => {
      expect(names(input)).toEqual(['Jugador A']);
    },
  );

  it.each([['*'], ['* '], ['- \n * ']])('ignores lines that hold only a bullet: %j', (input) => {
    expect(names(input)).toEqual([]);
  });

  it('skips empty bullet lines between names', () => {
    expect(names('- Jugador A\n*\n- Jugador E')).toEqual(['Jugador A', 'Jugador E']);
  });

  it('keeps an asterisk that is not a bullet and not a pair', () => {
    expect(names('*Jugador A')).toEqual(['*Jugador A']);
  });

  it('removes duplicates ignoring case, keeping the first spelling and position', () => {
    expect(names('Jugador A\nJugador E\njugador a\nJUGADOR A')).toEqual(['Jugador A', 'Jugador E']);
  });

  it('keeps the goalkeeper mark when a duplicate carries it', () => {
    expect(parsePastedNames('Jugador A\nJugador E\nJugador A (arquero)')).toEqual([
      { name: 'Jugador A', isGoalkeeper: true },
      { name: 'Jugador E', isGoalkeeper: false },
    ]);
  });

  it('cleans a realistic pasted list', () => {
    const pasted = [
      '1. Jugador A 🧤',
      '2) Jugador E',
      '3- Jugador G (GK)',
      `${KEYCAP_4} Jugador B, Jugador D; Jugador H`,
      '- *Jugador C*',
    ].join('\n');
    expect(parsePastedNames(pasted)).toEqual([
      { name: 'Jugador A', isGoalkeeper: true },
      { name: 'Jugador E', isGoalkeeper: false },
      { name: 'Jugador G', isGoalkeeper: true },
      { name: 'Jugador B', isGoalkeeper: false },
      { name: 'Jugador D', isGoalkeeper: false },
      { name: 'Jugador H', isGoalkeeper: false },
      { name: 'Jugador C', isGoalkeeper: false },
    ]);
  });
});
