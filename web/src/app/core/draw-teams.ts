export const MIN_TEAM_SIZE = 5;
export const MAX_TEAM_SIZE = 11;
export const MIN_TEAMS = 2;
export const MAX_TEAMS = 6;

export type DrawError = 'too-few' | 'too-many' | 'uneven';

export type DrawResult<T> =
  { ok: true; teams: T[][] } | { ok: false; error: DrawError; count: number };

// How many players a number of teams can have: from 5 to 11 on each team.
export function playerRange(teams: number): { min: number; max: number } {
  return { min: MIN_TEAM_SIZE * teams, max: MAX_TEAM_SIZE * teams };
}

// The range is checked before the divisibility, so 9 players are "too few", not "uneven".
export function checkPlayerCount(count: number, teams = 2): DrawError | null {
  const { min, max } = playerRange(teams);
  if (count < min) return 'too-few';
  if (count > max) return 'too-many';
  if (count % teams !== 0) return 'uneven';
  return null;
}

// Fisher-Yates on a copy, so the caller's list is never touched.
function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Goalkeepers go first in a team, and everybody else keeps their order.
export function keepersFirst<T extends { isGoalkeeper: boolean }>(team: readonly T[]): T[] {
  return [...team.filter((p) => p.isGoalkeeper), ...team.filter((p) => !p.isGoalkeeper)];
}

export function drawTeams<T extends { isGoalkeeper: boolean }>(
  players: readonly T[],
  random: () => number = Math.random,
  teamCount = 2,
): DrawResult<T> {
  const count = players.length;
  const error = checkPlayerCount(count, teamCount);
  if (error) return { ok: false, error, count };

  const keepers = shuffled(
    players.filter((p) => p.isGoalkeeper),
    random,
  );
  const fieldPlayers = shuffled(
    players.filter((p) => !p.isGoalkeeper),
    random,
  );

  // Keepers are dealt one by one, starting from a random team, so no team has more than
  // one above another.
  const teams: T[][] = Array.from({ length: teamCount }, () => []);
  const firstTeam = Math.floor(random() * teamCount);
  keepers.forEach((keeper, i) => teams[(firstTeam + i) % teamCount].push(keeper));

  const size = count / teamCount;
  let next = 0;
  for (const team of teams) {
    const missing = size - team.length;
    team.push(...fieldPlayers.slice(next, next + missing));
    next += missing;
  }

  return { ok: true, teams };
}

// Deals the players who have no team into the free places of teams that are already being
// built. A goalkeeper goes to a team that has none while there is one with room, and the rest
// is shuffled, so it works like a draw that starts from where the person left it.
export function completeTeams<T extends { isGoalkeeper: boolean }>(
  teams: readonly (readonly T[])[],
  pool: readonly T[],
  size: number,
  random: () => number = Math.random,
): T[][] {
  const result = teams.map((team) => [...team]);
  const keepers = shuffled(
    pool.filter((p) => p.isGoalkeeper),
    random,
  );
  const fieldPlayers = shuffled(
    pool.filter((p) => !p.isGoalkeeper),
    random,
  );

  for (const keeper of keepers) {
    const open = result.flatMap((team, i) => (team.length < size ? [i] : []));
    // Cannot happen while the pool fits in the free places.
    if (open.length === 0) break;
    const withoutKeeper = open.filter((i) => !result[i].some((p) => p.isGoalkeeper));
    const options = withoutKeeper.length > 0 ? withoutKeeper : open;
    result[options[Math.floor(random() * options.length)]].push(keeper);
  }

  let next = 0;
  for (const team of result) {
    const missing = Math.max(0, size - team.length);
    team.push(...fieldPlayers.slice(next, next + missing));
    next += missing;
  }

  return result.map(keepersFirst);
}
