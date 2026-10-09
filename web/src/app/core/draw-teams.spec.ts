import { drawTeams, DrawResult } from './draw-teams';

interface Player {
  name: string;
  isGoalkeeper: boolean;
}

// Small seeded generator so every run of the suite is deterministic.
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function squad(total: number, keepers = 0): Player[] {
  return Array.from({ length: total }, (_, i) => ({
    name: `P${i + 1}`,
    isGoalkeeper: i < keepers,
  }));
}

function teamsOf(result: DrawResult<Player>): [Player[], Player[]] {
  if (!result.ok) throw new Error(`expected a draw, got ${result.error}`);
  return result.teams;
}

const keepersIn = (team: Player[]) => team.filter((p) => p.isGoalkeeper).length;
const SEEDS = Array.from({ length: 200 }, (_, i) => i);
const TOTALS = [10, 12, 14, 16, 18, 20, 22];

describe('drawTeams', () => {
  describe('validation', () => {
    it.each([0, 5, 8, 9])('rejects %i players as too few', (count) => {
      expect(drawTeams(squad(count))).toEqual({ ok: false, error: 'too-few', count });
    });

    it.each([23, 24, 30])('rejects %i players as too many', (count) => {
      expect(drawTeams(squad(count))).toEqual({ ok: false, error: 'too-many', count });
    });

    it.each([11, 13, 15, 21])('rejects %i players because the number is odd', (count) => {
      expect(drawTeams(squad(count))).toEqual({ ok: false, error: 'odd', count });
    });

    it.each(TOTALS)('accepts %i players and splits them in two equal teams', (count) => {
      const [a, b] = teamsOf(drawTeams(squad(count), seeded(count)));
      expect(a).toHaveLength(count / 2);
      expect(b).toHaveLength(count / 2);
    });

    it('works with the default random source', () => {
      const [a, b] = teamsOf(drawTeams(squad(10, 2)));
      expect(a.length + b.length).toBe(10);
    });
  });

  describe('fairness of the split', () => {
    it('places every player in exactly one team', () => {
      for (const seed of SEEDS) {
        const total = TOTALS[seed % TOTALS.length];
        const players = squad(total, seed % 5);
        const [a, b] = teamsOf(drawTeams(players, seeded(seed)));
        const placed = [...a, ...b].map((p) => p.name).sort();
        expect(placed, `seed ${seed}`).toEqual(players.map((p) => p.name).sort());
      }
    });

    it('does not modify the list it receives', () => {
      const players = squad(12, 2);
      const before = players.map((p) => `${p.name}:${p.isGoalkeeper}`);
      drawTeams(players, seeded(3));
      expect(players.map((p) => `${p.name}:${p.isGoalkeeper}`)).toEqual(before);
    });

    it('is repeatable when it gets the same random sequence', () => {
      const players = squad(14, 2);
      expect(drawTeams(players, seeded(7))).toEqual(drawTeams(players, seeded(7)));
    });

    it('gives different splits for different random sequences', () => {
      const players = squad(12);
      const splits = new Set<string>();
      for (let seed = 0; seed < 50; seed++) {
        const [a, b] = teamsOf(drawTeams(players, seeded(seed)));
        const names = [a, b].map((t) =>
          t
            .map((p) => p.name)
            .sort()
            .join(','),
        );
        splits.add(names.sort().join('|'));
      }
      expect(splits.size).toBeGreaterThan(10);
    });
  });

  describe('goalkeepers', () => {
    it('puts one goalkeeper in each team when there are two', () => {
      for (const seed of SEEDS) {
        const total = TOTALS[seed % TOTALS.length];
        const [a, b] = teamsOf(drawTeams(squad(total, 2), seeded(seed)));
        expect([keepersIn(a), keepersIn(b)], `seed ${seed}`).toEqual([1, 1]);
      }
    });

    it('keeps a single goalkeeper in just one team', () => {
      const [a, b] = teamsOf(drawTeams(squad(12, 1), seeded(1)));
      expect(keepersIn(a) + keepersIn(b)).toBe(1);
    });

    it('splits three goalkeepers 2 and 1, never 3 and 0', () => {
      const splits = new Set<string>();
      for (const seed of SEEDS) {
        const [a, b] = teamsOf(drawTeams(squad(12, 3), seeded(seed)));
        splits.add(`${keepersIn(a)}-${keepersIn(b)}`);
      }
      expect([...splits].sort()).toEqual(['1-2', '2-1']);
    });

    it('splits four goalkeepers 2 and 2', () => {
      for (const seed of SEEDS.slice(0, 50)) {
        const [a, b] = teamsOf(drawTeams(squad(12, 4), seeded(seed)));
        expect([keepersIn(a), keepersIn(b)], `seed ${seed}`).toEqual([2, 2]);
      }
    });

    it.each([9, 10])(
      'still builds two full teams when %i of 10 players are goalkeepers',
      (keepers) => {
        for (const seed of SEEDS.slice(0, 50)) {
          const [a, b] = teamsOf(drawTeams(squad(10, keepers), seeded(seed)));
          expect([a.length, b.length], `seed ${seed}`).toEqual([5, 5]);
        }
      },
    );

    it('lists the goalkeepers first inside each team', () => {
      for (const seed of SEEDS.slice(0, 50)) {
        const teams = teamsOf(drawTeams(squad(14, 3), seeded(seed)));
        for (const team of teams) {
          const flags = team.map((p) => p.isGoalkeeper);
          expect(flags, `seed ${seed}`).toEqual([...flags].sort((x, y) => Number(y) - Number(x)));
        }
      }
    });
  });
});
