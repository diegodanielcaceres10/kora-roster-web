export const MIN_TEAM_SIZE = 5;
export const MAX_TEAM_SIZE = 11;

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
