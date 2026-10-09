export const MIN_PLAYERS = 10;
export const MAX_PLAYERS = 22;

export type DrawError = 'too-few' | 'too-many' | 'odd';

export type DrawResult<T> =
  { ok: true; teams: [T[], T[]] } | { ok: false; error: DrawError; count: number };

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
): DrawResult<T> {
  const count = players.length;
  if (count < MIN_PLAYERS) return { ok: false, error: 'too-few', count };
  if (count > MAX_PLAYERS) return { ok: false, error: 'too-many', count };
  if (count % 2 !== 0) return { ok: false, error: 'odd', count };

  const keepers = shuffled(
    players.filter((p) => p.isGoalkeeper),
    random,
  );
  const fieldPlayers = shuffled(
    players.filter((p) => !p.isGoalkeeper),
    random,
  );

  // Keepers are dealt one by one, so the teams never differ by more than one.
  const teams: [T[], T[]] = [[], []];
  const firstTeam = random() < 0.5 ? 0 : 1;
  keepers.forEach((keeper, i) => teams[(firstTeam + i) % 2].push(keeper));

  const missingInFirst = count / 2 - teams[0].length;
  teams[0].push(...fieldPlayers.slice(0, missingInFirst));
  teams[1].push(...fieldPlayers.slice(missingInFirst));

  return { ok: true, teams };
}
