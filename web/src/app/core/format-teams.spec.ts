import { DEFAULT_TEAM_ICONS, formatTeamsForWhatsApp } from './format-teams';

const p = (name: string, isGoalkeeper = false) => ({ name, isGoalkeeper });

const STYLES = [
  { icon: '🔴', title: 'Equipo 1' },
  { icon: '🔵', title: 'Equipo 2' },
];

describe('formatTeamsForWhatsApp', () => {
  it('writes each team with its icon and title, numbered players and a glove for goalkeepers', () => {
    const text = formatTeamsForWhatsApp(
      [
        [p('Diego', true), p('Mati')],
        [p('Nico', true), p('Fede')],
      ],
      STYLES,
    );
    expect(text).toBe(
      ['🔴 Equipo 1', '1. Diego 🧤', '2. Mati', '', '🔵 Equipo 2', '1. Nico 🧤', '2. Fede'].join(
        '\n',
      ),
    );
  });

  it('restarts the numbering in every team', () => {
    const text = formatTeamsForWhatsApp([[p('A'), p('B')], [p('C')]], STYLES);
    expect(text.split('\n')).toEqual(['🔴 Equipo 1', '1. A', '2. B', '', '🔵 Equipo 2', '1. C']);
  });

  it('marks only goalkeepers with the glove', () => {
    const text = formatTeamsForWhatsApp([[p('A'), p('B', true), p('C')], []], STYLES);
    expect(text).toContain('1. A\n2. B 🧤\n3. C');
    expect(text.match(/🧤/g)).toHaveLength(1);
  });

  it('separates teams with exactly one blank line and leaves no trailing whitespace', () => {
    const text = formatTeamsForWhatsApp([[p('A')], [p('B')]], STYLES);
    expect(text).toBe('🔴 Equipo 1\n1. A\n\n🔵 Equipo 2\n1. B');
    expect(text).toBe(text.trimEnd());
  });

  it('uses the icon and title given for each team', () => {
    const text = formatTeamsForWhatsApp(
      [[p('A')], [p('B')]],
      [
        { icon: '⚽', title: 'Local' },
        { icon: '🏆', title: 'Visitante' },
      ],
    );
    expect(text.split('\n')).toEqual(['⚽ Local', '1. A', '', '🏆 Visitante', '1. B']);
  });

  it('supports more than two teams, in order', () => {
    const styles = DEFAULT_TEAM_ICONS.slice(0, 4).map((icon, i) => ({
      icon,
      title: `Team ${i + 1}`,
    }));
    const text = formatTeamsForWhatsApp([[p('A')], [p('B')], [p('C')], [p('D')]], styles);
    const titles = text.split('\n').filter((line) => line.includes('Team'));
    expect(titles).toEqual(styles.map((s) => `${s.icon} ${s.title}`));
  });

  it('fails loudly when a team has no icon and title', () => {
    expect(() => formatTeamsForWhatsApp([[p('A')], [p('B')], [p('C')]], STYLES)).toThrow(
      RangeError,
    );
  });

  it('does not touch the names it receives', () => {
    const text = formatTeamsForWhatsApp([[p('José Luis')], [p('Ñandú 🔥')]], STYLES);
    expect(text).toContain('1. José Luis');
    expect(text).toContain('1. Ñandú 🔥');
  });
});

describe('formatTeamsForWhatsApp options', () => {
  const teams = [
    [p('Diego', true), p('Mati')],
    [p('Nico', true), p('Fede')],
  ];

  it.each([
    ['dot', '1. Diego 🧤', '2. Mati'],
    ['paren', '1) Diego 🧤', '2) Mati'],
    ['dash', '1- Diego 🧤', '2- Mati'],
    ['none', 'Diego 🧤', 'Mati'],
  ] as const)('numbers with the %s style', (numbering, first, second) => {
    const lines = formatTeamsForWhatsApp(teams, STYLES, { numbering }).split('\n');
    expect(lines.slice(0, 3)).toEqual(['🔴 Equipo 1', first, second]);
  });

  it('uses the same numbering style in every team', () => {
    const lines = formatTeamsForWhatsApp(teams, STYLES, { numbering: 'paren' }).split('\n');
    expect(lines.slice(4)).toEqual(['🔵 Equipo 2', '1) Nico 🧤', '2) Fede']);
  });

  it('puts the header first, followed by a blank line', () => {
    const lines = formatTeamsForWhatsApp(teams, STYLES, { header: '⚽ Amistoso jueves' }).split(
      '\n',
    );
    expect(lines.slice(0, 3)).toEqual(['⚽ Amistoso jueves', '', '🔴 Equipo 1']);
  });

  it('puts the footer last, after a blank line', () => {
    const lines = formatTeamsForWhatsApp(teams, STYLES, { footer: 'Confirmen asistencia' }).split(
      '\n',
    );
    expect(lines.slice(-3)).toEqual(['2. Fede', '', 'Confirmen asistencia']);
  });

  it('writes the header, the teams and the footer in that order', () => {
    const text = formatTeamsForWhatsApp(teams, STYLES, {
      header: 'ARRIBA',
      footer: 'ABAJO',
      numbering: 'none',
    });
    expect(text).toBe(
      [
        'ARRIBA',
        '',
        '🔴 Equipo 1',
        'Diego 🧤',
        'Mati',
        '',
        '🔵 Equipo 2',
        'Nico 🧤',
        'Fede',
        '',
        'ABAJO',
      ].join('\n'),
    );
  });

  it.each([[''], ['   '], ['\n\t']])(
    'leaves out a header and a footer that are blank: %j',
    (blank) => {
      const text = formatTeamsForWhatsApp(teams, STYLES, { header: blank, footer: blank });
      expect(text).toBe(formatTeamsForWhatsApp(teams, STYLES));
    },
  );

  it('trims the spaces around the header and the footer', () => {
    const text = formatTeamsForWhatsApp(teams, STYLES, { header: '  HEAD  ', footer: '\nFOOT  ' });
    expect(text.startsWith('HEAD\n\n🔴')).toBe(true);
    expect(text.endsWith('\n\nFOOT')).toBe(true);
  });

  it('is the same as before when no options are given', () => {
    expect(formatTeamsForWhatsApp(teams, STYLES, {})).toBe(formatTeamsForWhatsApp(teams, STYLES));
    expect(formatTeamsForWhatsApp(teams, STYLES, { numbering: 'dot' })).toBe(
      formatTeamsForWhatsApp(teams, STYLES),
    );
  });
});

describe('DEFAULT_TEAM_ICONS', () => {
  it('starts with the red and blue circles', () => {
    expect(DEFAULT_TEAM_ICONS.slice(0, 2)).toEqual(['🔴', '🔵']);
  });

  it('has six different icons, one per team of the biggest plan', () => {
    expect(new Set(DEFAULT_TEAM_ICONS).size).toBe(6);
    expect(DEFAULT_TEAM_ICONS).toHaveLength(6);
  });
});
