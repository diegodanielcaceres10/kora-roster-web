import { MAX_TEAM_SIZE, MAX_TEAMS, MIN_TEAM_SIZE, MIN_TEAMS } from '../core/draw-teams';
import { DEFAULT_TEAM_ICONS, Numbering } from '../core/format-teams';

export interface TeamPreference {
  icon: string;
  color: string;
}

export interface Preferences {
  // Players on each team, or null for "any size".
  playersPerTeam: number | null;
  // How many teams the person usually plays with. The plan may allow fewer.
  teamCount: number;
  // One entry for each of the six possible teams, so changing the number of teams in use
  // never loses an icon or a color. The six icons are always all different.
  teams: TeamPreference[];
  header: string;
  footer: string;
  numbering: Numbering;
}

export const TEAM_ICONS = DEFAULT_TEAM_ICONS;
export const HEADER_MAX = 200;

const DEFAULT_COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00'];

export const DEFAULT_PREFERENCES: Preferences = {
  playersPerTeam: null,
  teamCount: MIN_TEAMS,
  teams: TEAM_ICONS.map((icon, i) => ({ icon, color: DEFAULT_COLORS[i] })),
  header: '',
  footer: '',
  numbering: 'dot',
};

const NUMBERINGS: readonly Numbering[] = ['dot', 'paren', 'dash', 'none'];
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function team(value: unknown, fallback: TeamPreference, taken: string[]): TeamPreference {
  const raw = isRecord(value) ? value : {};
  let icon =
    typeof raw['icon'] === 'string' && TEAM_ICONS.includes(raw['icon'])
      ? raw['icon']
      : fallback.icon;
  // No two teams share an icon: the later one takes the first one that is free.
  if (taken.includes(icon))
    icon = TEAM_ICONS.find((free) => !taken.includes(free)) ?? fallback.icon;
  const color =
    typeof raw['color'] === 'string' && HEX_COLOR.test(raw['color'])
      ? raw['color'].toLowerCase()
      : fallback.color;
  return { icon, color };
}

const text = (value: unknown) => (typeof value === 'string' ? value.slice(0, HEADER_MAX) : '');

// Turns whatever was saved into valid preferences, field by field, so one damaged value
// never throws away the others. Preferences saved with only two teams are completed.
export function sanitizePreferences(value: unknown): Preferences {
  const raw = isRecord(value) ? value : {};
  const rawTeams = Array.isArray(raw['teams']) ? raw['teams'] : [];
  const teams: TeamPreference[] = [];
  DEFAULT_PREFERENCES.teams.forEach((fallback, i) => {
    teams.push(
      team(
        rawTeams[i],
        fallback,
        teams.map((placed) => placed.icon),
      ),
    );
  });
  const size = raw['playersPerTeam'];
  const count = raw['teamCount'];

  return {
    playersPerTeam:
      typeof size === 'number' &&
      Number.isInteger(size) &&
      size >= MIN_TEAM_SIZE &&
      size <= MAX_TEAM_SIZE
        ? size
        : null,
    teamCount:
      typeof count === 'number' &&
      Number.isInteger(count) &&
      count >= MIN_TEAMS &&
      count <= MAX_TEAMS
        ? count
        : MIN_TEAMS,
    teams,
    header: text(raw['header']),
    footer: text(raw['footer']),
    numbering: NUMBERINGS.find((numbering) => numbering === raw['numbering']) ?? 'dot',
  };
}
