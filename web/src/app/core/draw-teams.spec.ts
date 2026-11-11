import {
  checkPlayerCount,
  completeTeams,
  drawTeams,
  DrawResult,
  keepersFirst,
  MAX_TEAM_SIZE,
  MIN_TEAM_SIZE,
  playerRange,
} from './draw-teams';

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

function teamsOf(result: DrawResult<Player>): Player[][] {
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
      expect(drawTeams(squad(count))).toEqual({ ok: false, error: 'uneven', count });
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

describe('checkPlayerCount', () => {
  it.each([
    [0, 'too-few'],
    [9, 'too-few'],
    [23, 'too-many'],
    [24, 'too-many'],
    [11, 'uneven'],
    [13, 'uneven'],
    [21, 'uneven'],
  ])('reports %i players as %s', (count, error) => {
    expect(checkPlayerCount(count)).toBe(error);
  });

  it.each([10, 12, 16, 22])('accepts %i players', (count) => {
    expect(checkPlayerCount(count)).toBeNull();
  });

  it('agrees with drawTeams for every count from 0 to 30', () => {
    for (let count = 0; count <= 30; count++) {
      const error = checkPlayerCount(count);
      const result = drawTeams(squad(count), seeded(1));
      expect(result.ok, `count ${count}`).toBe(error === null);
      if (!result.ok) expect(result.error, `count ${count}`).toBe(error);
    }
  });
});

describe('playerRange', () => {
  it('is from 5 to 11 players for every team', () => {
    expect([MIN_TEAM_SIZE, MAX_TEAM_SIZE]).toEqual([5, 11]);
  });

  it.each([
    [2, 10, 22],
    [3, 15, 33],
    [4, 20, 44],
    [6, 30, 66],
  ])('allows %i teams from %i to %i players', (teams, min, max) => {
    expect(playerRange(teams)).toEqual({ min, max });
  });
});

describe('with 3 and 4 teams', () => {
  const COUNTS = [0, 5, 10, 12, 14, 15, 16, 17, 18, 20, 21, 22, 24, 30, 33, 34, 35, 40, 44, 45, 46];

  it.each([
    [3, 12, 'too-few'],
    [3, 14, 'too-few'],
    [3, 16, 'uneven'],
    [3, 17, 'uneven'],
    [3, 34, 'too-many'],
    [3, 35, 'too-many'],
    [4, 16, 'too-few'],
    [4, 19, 'too-few'],
    [4, 21, 'uneven'],
    [4, 22, 'uneven'],
    [4, 45, 'too-many'],
    [4, 48, 'too-many'],
  ])('with %i teams, %i players are %s', (teams, count, error) => {
    expect(checkPlayerCount(count, teams)).toBe(error);
    expect(drawTeams(squad(count), seeded(1), teams)).toEqual({ ok: false, error, count });
  });

  it.each([
    [3, 15],
    [3, 18],
    [3, 33],
    [4, 20],
    [4, 24],
    [4, 44],
  ])('with %i teams, %i players are accepted', (teams, count) => {
    expect(checkPlayerCount(count, teams)).toBeNull();
  });

  it('checks the range before the divisibility, as with 2 teams', () => {
    expect(checkPlayerCount(13, 3)).toBe('too-few');
    expect(checkPlayerCount(45, 4)).toBe('too-many');
  });

  it('agrees with drawTeams for every count and every number of teams', () => {
    for (const teams of [2, 3, 4]) {
      for (let count = 0; count <= 50; count++) {
        const error = checkPlayerCount(count, teams);
        const result = drawTeams(squad(count), seeded(1), teams);
        expect(result.ok, `${teams} teams, ${count} players`).toBe(error === null);
        if (!result.ok) expect(result.error, `${teams} teams, ${count} players`).toBe(error);
      }
    }
    expect(COUNTS.length).toBeGreaterThan(0);
  });

  it.each([
    [3, 15],
    [3, 33],
    [4, 20],
    [4, 44],
  ])('splits %i teams of %i players into teams of the same size', (teams, count) => {
    const result = teamsOf(drawTeams(squad(count), seeded(count), teams));
    expect(result).toHaveLength(teams);
    expect(result.map((team) => team.length)).toEqual(Array(teams).fill(count / teams));
  });

  it('places every player in exactly one team', () => {
    for (const seed of SEEDS) {
      const teams = 3 + (seed % 2);
      const count = teams * (5 + (seed % 7));
      const players = squad(count, seed % 9);
      const placed = teamsOf(drawTeams(players, seeded(seed), teams))
        .flat()
        .map((p) => p.name)
        .sort();
      expect(placed, `seed ${seed}`).toEqual(players.map((p) => p.name).sort());
    }
  });

  it('never gives one team more than one goalkeeper above another', () => {
    for (const seed of SEEDS) {
      const teams = 3 + (seed % 2);
      const keepers = seed % 9;
      const result = teamsOf(drawTeams(squad(teams * 6, keepers), seeded(seed), teams));
      const counts = result.map(keepersIn);
      expect(Math.max(...counts) - Math.min(...counts), `seed ${seed}`).toBeLessThanOrEqual(1);
      expect(
        counts.reduce((a, b) => a + b, 0),
        `seed ${seed}`,
      ).toBe(keepers);
    }
  });

  it('gives each team one goalkeeper when there are as many as teams', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const result = teamsOf(drawTeams(squad(20, 4), seeded(seed), 4));
      expect(result.map(keepersIn), `seed ${seed}`).toEqual([1, 1, 1, 1]);
    }
  });

  it('chooses at random which teams get the extra goalkeeper', () => {
    const gotTwo = new Set<number>();
    for (const seed of SEEDS) {
      teamsOf(drawTeams(squad(18, 4), seeded(seed), 3)).forEach((team, i) => {
        if (keepersIn(team) === 2) gotTwo.add(i);
      });
    }
    expect([...gotTwo].sort()).toEqual([0, 1, 2]);
  });

  it('lists the goalkeepers first inside each team', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      for (const team of teamsOf(drawTeams(squad(24, 5), seeded(seed), 4))) {
        const flags = team.map((p) => p.isGoalkeeper);
        expect(flags, `seed ${seed}`).toEqual([...flags].sort((x, y) => Number(y) - Number(x)));
      }
    }
  });

  it.each([
    [3, 15],
    [3, 14],
    [4, 20],
    [4, 19],
  ])(
    'still builds full teams when %i teams have %i of their players as goalkeepers',
    (teams, keepers) => {
      const count = teams * 5;
      for (const seed of SEEDS.slice(0, 30)) {
        const result = teamsOf(drawTeams(squad(count, keepers), seeded(seed), teams));
        expect(
          result.map((team) => team.length),
          `seed ${seed}`,
        ).toEqual(Array(teams).fill(5));
      }
    },
  );

  it('is repeatable and leaves the list it receives alone', () => {
    const players = squad(20, 3);
    const before = players.map((p) => p.name);
    expect(drawTeams(players, seeded(9), 4)).toEqual(drawTeams(players, seeded(9), 4));
    expect(players.map((p) => p.name)).toEqual(before);
  });

  it('draws 2 teams when the number of teams is left out', () => {
    const players = squad(12, 2);
    expect(drawTeams(players, seeded(5))).toEqual(drawTeams(players, seeded(5), 2));
    expect(teamsOf(drawTeams(players, seeded(5)))).toHaveLength(2);
  });
});

describe('keepersFirst', () => {
  it('puts the goalkeepers first and keeps the order of everybody else', () => {
    const team: Player[] = [
      { name: 'A', isGoalkeeper: false },
      { name: 'B', isGoalkeeper: true },
      { name: 'C', isGoalkeeper: false },
      { name: 'D', isGoalkeeper: true },
    ];
    expect(keepersFirst(team).map((p) => p.name)).toEqual(['B', 'D', 'A', 'C']);
  });

  it('returns a new list and leaves the given one as it was', () => {
    const team: Player[] = [
      { name: 'A', isGoalkeeper: false },
      { name: 'B', isGoalkeeper: true },
    ];
    const result = keepersFirst(team);
    expect(result).not.toBe(team);
    expect(team.map((p) => p.name)).toEqual(['A', 'B']);
  });
});

describe('completeTeams', () => {
  const keeper = (name: string): Player => ({ name, isGoalkeeper: true });
  const field = (name: string): Player => ({ name, isGoalkeeper: false });
  const names = (players: Player[]) => players.map((p) => p.name).sort();

  it('fills every team up to its size from the pool, and nobody is lost or repeated', () => {
    const all = squad(10);
    const teams = [[all[0], all[1]], [all[2]]];
    const result = completeTeams(teams, all.slice(3), 5, seeded(1));
    expect(result.map((team) => team.length)).toEqual([5, 5]);
    expect(names(result.flat())).toEqual(names(all));
  });

  it('keeps the players who were already in a team where they were', () => {
    const all = squad(10);
    const teams = [[all[0], all[1]], [all[2]]];
    const result = completeTeams(teams, all.slice(3), 5, seeded(2));
    expect(result[0]).toEqual(expect.arrayContaining([all[0], all[1]]));
    expect(result[1]).toContain(all[2]);
  });

  it('only fills the places that are free in each team', () => {
    const all = squad(12);
    const teams = [all.slice(0, 5), [all[5]]];
    const result = completeTeams(teams, all.slice(6), 6, seeded(3));
    expect(result.map((team) => team.length)).toEqual([6, 6]);
    expect(result[0].slice(0, 5)).toEqual(all.slice(0, 5));
    expect(result[1][0]).toBe(all[5]);
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])(
    'gives a goalkeeper of the pool to the team that has none (seed %i)',
    (seed) => {
      const teams = [[keeper('A1'), field('a2')], [field('b1')]];
      const pool = [keeper('B1'), ...Array.from({ length: 6 }, (_, i) => field(`x${i}`))];
      const result = completeTeams(teams, pool, 5, seeded(seed));
      expect(result[0].filter((p) => p.isGoalkeeper)).toHaveLength(1);
      expect(result[1].filter((p) => p.isGoalkeeper).map((p) => p.name)).toEqual(['B1']);
    },
  );

  it.each([1, 2, 3, 4, 5, 6])(
    'spreads two goalkeepers of the pool over two teams that have none (seed %i)',
    (seed) => {
      const pool = [
        keeper('G1'),
        keeper('G2'),
        ...Array.from({ length: 8 }, (_, i) => field(`x${i}`)),
      ];
      const result = completeTeams([[], []], pool, 5, seeded(seed));
      expect(result.map((team) => team.filter((p) => p.isGoalkeeper).length)).toEqual([1, 1]);
    },
  );

  it('still places a goalkeeper when every team already has one', () => {
    const teams = [
      [keeper('A1'), field('a2'), field('a3')],
      [keeper('B1'), field('b2'), field('b3')],
    ];
    const pool = [keeper('C1'), field('x1'), field('x2'), field('x3')];
    const result = completeTeams(teams, pool, 5, seeded(4));
    expect(result.map((team) => team.length)).toEqual([5, 5]);
    expect(result.flat().map((p) => p.name)).toContain('C1');
  });

  it('keeps the goalkeepers first in every team', () => {
    const teams = [[field('a1')], [keeper('B1'), field('b2')]];
    const pool = [
      keeper('C1'),
      keeper('C2'),
      ...Array.from({ length: 5 }, (_, i) => field(`x${i}`)),
    ];
    const result = completeTeams(teams, pool, 5, seeded(5));
    for (const team of result) {
      const flags = team.map((p) => p.isGoalkeeper);
      expect(flags).toEqual([...flags].sort((a, b) => Number(b) - Number(a)));
    }
  });

  it('returns the same teams when the pool is empty', () => {
    const teams = [squad(5), squad(5)];
    expect(completeTeams(teams, [], 5, seeded(1))).toEqual(teams);
  });

  it('does not touch the teams or the pool it was given', () => {
    const all = squad(10, 2);
    const teams = [[all[0]], [all[1]]];
    const pool = all.slice(2);
    const snapshot = structuredClone({ teams, pool });
    completeTeams(teams, pool, 5, seeded(6));
    expect({ teams, pool }).toEqual(snapshot);
  });

  it('gives the same result for the same seed', () => {
    const all = squad(12, 2);
    const run = () => completeTeams([[all[0]], []], all.slice(1), 6, seeded(9));
    expect(run()).toEqual(run());
  });
});
