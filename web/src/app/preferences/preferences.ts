import { MAX_TEAMS, MIN_TEAMS } from '../core/draw-teams';
import { DEFAULT_TEAM_ICONS, Numbering } from '../core/format-teams';

export interface TeamPreference {
  icon: string;
  color: string;
}

export interface Preferences {
  // Players on each team, or null for "any size".
  // How many teams the person usually plays with. The plan may allow fewer.
  teamCount: number;
  // One entry for each of the six possible teams, so changing the number of teams in use
  // never loses an icon or a color. The six icons are always all different.
  teams: TeamPreference[];
  header: string;
  // Where the pitch is, for the message: an address, a link to a map...
  location: string;
  footer: string;
  numbering: Numbering;
}

export const TEAM_ICONS = DEFAULT_TEAM_ICONS;
export const ALL_TEAM_ICONS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚪', '⚫', '🟤'];
export const HEADER_MAX = 200;

const DEFAULT_COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00'];

const COLOR_PALETTE: readonly { icon: string; r: number; g: number; b: number }[] = [
  { icon: '⚪', r: 255, g: 255, b: 255 },
  { icon: '⚫', r: 20, g: 20, b: 20 },
  { icon: '🔴', r: 229, g: 57, b: 53 },
  { icon: '🟠', r: 251, g: 140, b: 0 },
  { icon: '🟡', r: 253, g: 216, b: 53 },
  { icon: '🟢', r: 67, g: 160, b: 71 },
  { icon: '🔵', r: 30, g: 136, b: 229 },
  { icon: '🟣', r: 142, g: 36, b: 170 },
  { icon: '🟤', r: 121, g: 85, b: 72 },
];

export function colorToIcon(hex: string): string {
  if (!HEX_COLOR.test(hex)) return '⚪';
  const num = parseInt(hex.slice(1), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  let bestIcon = '⚪';
  let minDistance = Infinity;

  for (const item of COLOR_PALETTE) {
    const rmean = (r + item.r) / 2;
    const dr = r - item.r;
    const dg = g - item.g;
    const db = b - item.b;
    const distance = (2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db;
    if (distance < minDistance) {
      minDistance = distance;
      bestIcon = item.icon;
    }
  }
  return bestIcon;
}

export const DEFAULT_PREFERENCES: Preferences = {
  teamCount: MIN_TEAMS,
  teams: TEAM_ICONS.map((icon, i) => ({ icon, color: DEFAULT_COLORS[i] })),
  header: '',
  location: '',
  footer: '',
  numbering: 'dot',
};

const NUMBERINGS: readonly Numbering[] = ['dot', 'paren', 'dash', 'none'];
export const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function team(value: unknown, fallback: TeamPreference, taken: string[]): TeamPreference {
  const raw = isRecord(value) ? value : {};
  const color =
    typeof raw['color'] === 'string' && HEX_COLOR.test(raw['color'])
      ? raw['color'].toLowerCase()
      : fallback.color;
  let icon =
    typeof raw['icon'] === 'string' && ALL_TEAM_ICONS.includes(raw['icon'])
      ? raw['icon']
      : colorToIcon(color);
  if (taken.includes(icon))
    icon = ALL_TEAM_ICONS.find((free) => !taken.includes(free)) ?? fallback.icon;
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
  const count = raw['teamCount'];

  return {
    teamCount:
      typeof count === 'number' &&
      Number.isInteger(count) &&
      count >= MIN_TEAMS &&
      count <= MAX_TEAMS
        ? count
        : MIN_TEAMS,
    teams,
    header: text(raw['header']),
    location: text(raw['location']),
    footer: text(raw['footer']),
    numbering: NUMBERINGS.find((numbering) => numbering === raw['numbering']) ?? 'dot',
  };
}

// A copy in which every team has the icon that matches its color.
export const withIconsFromColors = (preferences: Preferences): Preferences => ({
  ...preferences,
  teams: preferences.teams.map((team) => ({
    ...team,
    icon: colorToIcon(team.color),
  })),
});

export const samePreferences = (a: Preferences, b: Preferences): boolean =>
  a.teamCount === b.teamCount &&
  a.header === b.header &&
  a.location === b.location &&
  a.footer === b.footer &&
  a.numbering === b.numbering &&
  a.teams.length === b.teams.length &&
  a.teams.every((team, i) => team.color === b.teams[i].color && team.icon === b.teams[i].icon);
