import { checkPlayerCount, playerRange } from '../../core/draw-teams';
import type { Dictionary } from '../../i18n/en';

// What a list of players needs, or that it is ready, to be drawn into the given number of teams.
export function countStatus(
  status: Dictionary['tool']['preview']['status'],
  count: number,
  teams: number,
): string {
  const { min, max } = playerRange(teams);
  switch (checkPlayerCount(count, teams)) {
    case 'too-few':
      return status.tooFew(min - count, min);
    case 'too-many':
      return status.tooMany(count - max, max);
    case 'uneven':
      return status.uneven(count, teams);
    default:
      return status.ok;
  }
}
