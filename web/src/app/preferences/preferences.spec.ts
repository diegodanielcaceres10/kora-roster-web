import { DEFAULT_TEAM_ICONS } from '../core/format-teams';
import {
  DEFAULT_PREFERENCES,
  HEADER_MAX,
  MAX_TEAM_SIZE,
  MIN_TEAM_SIZE,
  sanitizePreferences,
  TEAM_ICONS,
} from './preferences';

const teams = (first: unknown, second: unknown) => ({ teams: [first, second] });

describe('DEFAULT_PREFERENCES', () => {
  it('lets any team size, red and blue circles, no header or footer and dotted numbers', () => {
    expect(DEFAULT_PREFERENCES).toEqual({
      playersPerTeam: null,
      teams: [
        { icon: '🔴', color: '#e53935' },
        { icon: '🔵', color: '#1e88e5' },
      ],
      header: '',
      footer: '',
      numbering: 'dot',
    });
  });

  it('offers the six team circles and a team size from 5 to 11', () => {
    expect(TEAM_ICONS).toEqual(DEFAULT_TEAM_ICONS);
    expect([MIN_TEAM_SIZE, MAX_TEAM_SIZE, HEADER_MAX]).toEqual([5, 11, 200]);
  });
});

describe('sanitizePreferences', () => {
  it.each([[undefined], [null], [42], ['text'], [[]], [true]])(
    'gives the defaults for %j',
    (value) => {
      expect(sanitizePreferences(value)).toEqual(DEFAULT_PREFERENCES);
    },
  );

  it('never hands out the default object itself, so nobody can change it by accident', () => {
    const result = sanitizePreferences(null);
    expect(result).not.toBe(DEFAULT_PREFERENCES);
    result.teams[0].icon = '🟢';
    result.header = 'changed';
    expect(DEFAULT_PREFERENCES.teams[0].icon).toBe('🔴');
    expect(DEFAULT_PREFERENCES.header).toBe('');
  });

  it('keeps a complete valid set of preferences exactly as it is', () => {
    const valid = {
      playersPerTeam: 7,
      teams: [
        { icon: '🟢', color: '#00ff00' },
        { icon: '🟡', color: '#ffff00' },
      ],
      header: '⚽ Amistoso',
      footer: 'Confirmen',
      numbering: 'paren',
    };
    expect(sanitizePreferences(valid)).toEqual(valid);
  });

  it('drops anything it does not know', () => {
    const result = sanitizePreferences({ ...DEFAULT_PREFERENCES, evil: '<script>' });
    expect(Object.keys(result).sort()).toEqual(
      ['footer', 'header', 'numbering', 'playersPerTeam', 'teams'].sort(),
    );
  });

  it('gives the same result when it is applied twice', () => {
    const messy = {
      playersPerTeam: '9',
      teams: [{ icon: '🔵' }, { icon: '🔵', color: 'X' }],
      header: 7,
    };
    const once = sanitizePreferences(messy);
    expect(sanitizePreferences(once)).toEqual(once);
  });

  describe('players per team', () => {
    it.each([5, 7, 11])('accepts %i', (playersPerTeam) => {
      expect(sanitizePreferences({ playersPerTeam }).playersPerTeam).toBe(playersPerTeam);
    });

    it.each([[null], [4], [12], [0], [-5], [7.5], ['7'], [NaN], [undefined]])(
      'turns %j into "any"',
      (playersPerTeam) => {
        expect(sanitizePreferences({ playersPerTeam }).playersPerTeam).toBeNull();
      },
    );
  });

  describe('team icons', () => {
    it.each(DEFAULT_TEAM_ICONS)('accepts %s', (icon) => {
      const other = icon === '🟢' ? '🟡' : '🟢';
      expect(sanitizePreferences(teams({ icon }, { icon: other })).teams[0].icon).toBe(icon);
    });

    it('goes back to the default icon of a team when the saved one is not offered', () => {
      const result = sanitizePreferences(teams({ icon: '💥' }, { icon: 42 }));
      expect(result.teams.map((team) => team.icon)).toEqual(['🔴', '🔵']);
    });

    it('never lets both teams share an icon: the second one takes the first free icon', () => {
      const result = sanitizePreferences(teams({ icon: '🔵' }, { icon: '🔵' }));
      expect(result.teams.map((team) => team.icon)).toEqual(['🔵', '🔴']);
    });

    it('resolves a clash with the default of the first team too', () => {
      const result = sanitizePreferences(teams({ icon: 'bad' }, { icon: '🔴' }));
      expect(result.teams.map((team) => team.icon)).toEqual(['🔴', '🔵']);
    });

    it.each([[undefined], ['text'], [[]], [[{ icon: '🟢' }]]])(
      'fills in what is missing when teams is %j',
      (value) => {
        const result = sanitizePreferences({ teams: value });
        expect(result.teams).toHaveLength(2);
        expect(new Set(result.teams.map((team) => team.icon)).size).toBe(2);
      },
    );
  });

  describe('team colors', () => {
    it('keeps a hex color and writes it in lower case', () => {
      expect(sanitizePreferences(teams({ color: '#AABBCC' }, {})).teams[0].color).toBe('#aabbcc');
    });

    it.each([['#abc'], ['red'], ['aabbcc'], ['#gggggg'], ['#aabbccdd'], [7], [undefined]])(
      'goes back to the default color for %j',
      (color) => {
        const result = sanitizePreferences(teams({ color }, { color }));
        expect(result.teams.map((team) => team.color)).toEqual(['#e53935', '#1e88e5']);
      },
    );
  });

  describe('header and footer', () => {
    it('keeps text as it is', () => {
      const result = sanitizePreferences({ header: '  ⚽ Hola  ', footer: 'Chau' });
      expect([result.header, result.footer]).toEqual(['  ⚽ Hola  ', 'Chau']);
    });

    it.each([[7], [null], [undefined], [{}]])('turns %j into an empty text', (value) => {
      const result = sanitizePreferences({ header: value, footer: value });
      expect([result.header, result.footer]).toEqual(['', '']);
    });

    it('cuts text that is longer than 200 characters', () => {
      const result = sanitizePreferences({ header: 'a'.repeat(250), footer: 'b'.repeat(201) });
      expect(result.header).toBe('a'.repeat(200));
      expect(result.footer).toBe('b'.repeat(200));
    });
  });

  describe('numbering', () => {
    it.each(['dot', 'paren', 'dash', 'none'])('accepts %s', (numbering) => {
      expect(sanitizePreferences({ numbering }).numbering).toBe(numbering);
    });

    it.each([['roman'], [''], [1], [undefined]])('turns %j into dot', (numbering) => {
      expect(sanitizePreferences({ numbering }).numbering).toBe('dot');
    });
  });
});
