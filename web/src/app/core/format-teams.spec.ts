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

describe('DEFAULT_TEAM_ICONS', () => {
  it('starts with the red and blue circles', () => {
    expect(DEFAULT_TEAM_ICONS.slice(0, 2)).toEqual(['🔴', '🔵']);
  });

  it('has six different icons, one per team of the biggest plan', () => {
    expect(new Set(DEFAULT_TEAM_ICONS).size).toBe(6);
    expect(DEFAULT_TEAM_ICONS).toHaveLength(6);
  });
});
