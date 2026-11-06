import { MAX_TEAM_SIZE, MAX_TEAMS, MIN_TEAM_SIZE, MIN_TEAMS } from '../core/draw-teams';
import { DEFAULT_TEAM_ICONS } from '../core/format-teams';
import {
  DEFAULT_PREFERENCES,
  HEADER_MAX,
  Preferences,
  sanitizePreferences,
  TEAM_ICONS,
} from './preferences';

const DEFAULT_COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00'];

// Teams as they could have been saved: only the first ones, or with parts missing.
const withTeams = (teams: unknown) => ({ teams });

describe('DEFAULT_PREFERENCES', () => {
  it('lets any team size, 2 teams, no header or footer and dotted numbers', () => {
    expect(DEFAULT_PREFERENCES.playersPerTeam).toBeNull();
    expect(DEFAULT_PREFERENCES.teamCount).toBe(2);
    expect([DEFAULT_PREFERENCES.header, DEFAULT_PREFERENCES.footer]).toEqual(['', '']);
    expect(DEFAULT_PREFERENCES.numbering).toBe('dot');
  });

  it('has one icon and one color for each of the six possible teams, all icons different', () => {
    expect(DEFAULT_PREFERENCES.teams.map((team) => team.icon)).toEqual(DEFAULT_TEAM_ICONS);
    expect(DEFAULT_PREFERENCES.teams.map((team) => team.color)).toEqual(DEFAULT_COLORS);
    expect(new Set(DEFAULT_PREFERENCES.teams.map((team) => team.icon)).size).toBe(6);
  });

  it('offers the six team circles, from 2 to 6 teams, and a team size from 5 to 11', () => {
    expect(TEAM_ICONS).toEqual(DEFAULT_TEAM_ICONS);
    expect([MIN_TEAMS, MAX_TEAMS]).toEqual([2, 6]);
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
    const valid: Preferences = {
      playersPerTeam: 7,
      teamCount: 4,
      teams: [
        { icon: '🟢', color: '#00ff00' },
        { icon: '🟡', color: '#ffff00' },
        { icon: '🔴', color: '#111111' },
        { icon: '🔵', color: '#222222' },
        { icon: '🟣', color: '#333333' },
        { icon: '🟠', color: '#444444' },
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
      ['footer', 'header', 'numbering', 'playersPerTeam', 'teamCount', 'teams'].sort(),
    );
  });

  it('gives the same result when it is applied twice', () => {
    const messy = {
      playersPerTeam: '9',
      teamCount: 9,
      teams: [{ icon: '🔵' }, { icon: '🔵', color: 'X' }, 5],
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

  describe('number of teams', () => {
    it.each([2, 3, 4, 5, 6])('accepts %i', (teamCount) => {
      expect(sanitizePreferences({ teamCount }).teamCount).toBe(teamCount);
    });

    it.each([[null], [1], [0], [7], [3.5], ['3'], [NaN], [undefined], [-4]])(
      'turns %j into 2',
      (teamCount) => {
        expect(sanitizePreferences({ teamCount }).teamCount).toBe(2);
      },
    );
  });

  describe('team icons', () => {
    it('keeps any arrangement of the six circles', () => {
      const reversed = [...TEAM_ICONS].reverse();
      const result = sanitizePreferences(withTeams(reversed.map((icon) => ({ icon }))));
      expect(result.teams.map((team) => team.icon)).toEqual(reversed);
    });

    it('goes back to the default icon of a team when the saved one is not offered', () => {
      const result = sanitizePreferences(withTeams([{ icon: '💥' }, { icon: 42 }]));
      expect(result.teams.map((team) => team.icon)).toEqual(DEFAULT_TEAM_ICONS);
    });

    it('never lets two teams share an icon: the later one takes the first free icon', () => {
      const result = sanitizePreferences(withTeams([{ icon: '🔵' }, { icon: '🔵' }]));
      expect(result.teams.slice(0, 2).map((team) => team.icon)).toEqual(['🔵', '🔴']);
      expect(new Set(result.teams.map((team) => team.icon)).size).toBe(6);
    });

    it('resolves a clash with the default icon of an earlier team too', () => {
      const result = sanitizePreferences(withTeams([{ icon: 'bad' }, { icon: '🔴' }]));
      expect(result.teams.slice(0, 2).map((team) => team.icon)).toEqual(['🔴', '🔵']);
    });

    it('always ends with the six circles, each one used once, whatever was saved', () => {
      const messy = [
        withTeams([{ icon: '🟠' }, { icon: '🟠' }, { icon: '🟠' }, { icon: '🟠' }]),
        withTeams([{ icon: '🟣' }, { icon: '💥' }, { icon: '🟣' }]),
        withTeams('nope'),
        withTeams([null, null, null, null, null, null, null, null]),
      ];
      for (const saved of messy) {
        const icons = sanitizePreferences(saved).teams.map((team) => team.icon);
        expect([...icons].sort(), JSON.stringify(saved)).toEqual([...TEAM_ICONS].sort());
      }
    });
  });

  describe('how many teams are kept', () => {
    it('always keeps six, filling in the ones that were not saved with the free circles', () => {
      const result = sanitizePreferences(
        withTeams([
          { icon: '🟢', color: '#00ff00' },
          { icon: '🟡', color: '#ffff00' },
        ]),
      );
      expect(result.teams).toEqual([
        { icon: '🟢', color: '#00ff00' },
        { icon: '🟡', color: '#ffff00' },
        { icon: '🔴', color: '#43a047' },
        { icon: '🔵', color: '#fdd835' },
        { icon: '🟣', color: '#8e24aa' },
        { icon: '🟠', color: '#fb8c00' },
      ]);
    });

    it('ignores the teams beyond the sixth', () => {
      const extra = Array.from({ length: 9 }, (_, i) => ({
        icon: TEAM_ICONS[i % 6],
        color: '#111111',
      }));
      expect(sanitizePreferences(withTeams(extra)).teams).toHaveLength(6);
    });

    it.each([[undefined], ['text'], [[]], [{}]])('fills all six when teams is %j', (teams) => {
      expect(sanitizePreferences(withTeams(teams)).teams).toEqual(DEFAULT_PREFERENCES.teams);
    });
  });

  describe('team colors', () => {
    it('keeps a hex color and writes it in lower case', () => {
      const result = sanitizePreferences(withTeams([{ color: '#AABBCC' }]));
      expect(result.teams[0].color).toBe('#aabbcc');
    });

    it.each([['#abc'], ['red'], ['aabbcc'], ['#gggggg'], ['#aabbccdd'], [7], [undefined]])(
      'goes back to the default color of the team for %j',
      (color) => {
        const result = sanitizePreferences(withTeams(DEFAULT_COLORS.map(() => ({ color }))));
        expect(result.teams.map((team) => team.color)).toEqual(DEFAULT_COLORS);
      },
    );

    it('keeps the color of each team on that team, whichever icon it has', () => {
      const result = sanitizePreferences(
        withTeams([
          { icon: '🟠', color: '#111111' },
          { icon: '🔴', color: '#222222' },
        ]),
      );
      expect(result.teams.slice(0, 2).map((team) => team.color)).toEqual(['#111111', '#222222']);
    });
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
