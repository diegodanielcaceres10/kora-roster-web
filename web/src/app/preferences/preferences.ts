import { DEFAULT_TEAM_ICONS, Numbering } from '../core/format-teams';

export interface TeamPreference {
  icon: string;
  color: string;
}

export interface Preferences {
  // Players on each team, or null for "any size".
  playersPerTeam: number | null;
  teams: [TeamPreference, TeamPreference];
  header: string;
  footer: string;
  numbering: Numbering;
}

export const TEAM_ICONS = DEFAULT_TEAM_ICONS;
export const MIN_TEAM_SIZE = 5;
export const MAX_TEAM_SIZE = 11;
export const HEADER_MAX = 200;

export const DEFAULT_PREFERENCES: Preferences = {
  playersPerTeam: null,
  teams: [
    { icon: '🔴', color: '#e53935' },
    { icon: '🔵', color: '#1e88e5' },
  ],
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
  // Two teams never share an icon: the later one takes the first one that is free.
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
// never throws away the others.
export function sanitizePreferences(value: unknown): Preferences {
  const raw = isRecord(value) ? value : {};
  const rawTeams = Array.isArray(raw['teams']) ? raw['teams'] : [];
  const first = team(rawTeams[0], DEFAULT_PREFERENCES.teams[0], []);
  const second = team(rawTeams[1], DEFAULT_PREFERENCES.teams[1], [first.icon]);
  const size = raw['playersPerTeam'];

  return {
    playersPerTeam:
      typeof size === 'number' &&
      Number.isInteger(size) &&
      size >= MIN_TEAM_SIZE &&
      size <= MAX_TEAM_SIZE
        ? size
        : null,
    teams: [first, second],
    header: text(raw['header']),
    footer: text(raw['footer']),
    numbering: NUMBERINGS.find((numbering) => numbering === raw['numbering']) ?? 'dot',
  };
}
