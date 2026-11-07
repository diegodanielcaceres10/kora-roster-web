import { readableTextColor } from './contrast';
import {
  layoutStory,
  Measure,
  RectCommand,
  STORY_HEIGHT,
  STORY_WIDTH,
  StoryInput,
  StoryLayout,
  StoryTeam,
  TextCommand,
} from './story-layout';

// A made-up font where every character is as wide as 55% of its size.
const measure: Measure = (text, size) => text.length * size * 0.55;

const COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00'];
const MARGIN = 48;

const players = (count: number, keepers = 0) =>
  Array.from({ length: count }, (_, i) => ({ name: `Player ${i + 1}`, isGoalkeeper: i < keepers }));

const team = (index: number, count: number, keepers = 0): StoryTeam => ({
  title: `Team ${index + 1}`,
  color: COLORS[index],
  players: players(count, keepers),
});

const teams = (count: number, size: number, keepers = 1) =>
  Array.from({ length: count }, (_, i) => team(i, size, i === 0 ? keepers : 0));

const input = (list: StoryTeam[], extra: Partial<StoryInput> = {}): StoryInput => ({
  teams: list,
  header: '',
  footer: '',
  numbering: 'dot',
  ...extra,
});

// Everything is grouped as the layout emits it: header, footer and brand first, then each
// team block followed by its own texts.
function groups(layout: StoryLayout) {
  const before: TextCommand[] = [];
  const blocks: { rect: RectCommand; texts: TextCommand[] }[] = [];
  for (const command of layout.commands) {
    if (command.kind === 'rect') blocks.push({ rect: command, texts: [] });
    else if (blocks.length === 0) before.push(command);
    else blocks[blocks.length - 1].texts.push(command);
  }
  return { before, blocks };
}

const overlap = (a: RectCommand, b: RectCommand) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe('layoutStory', () => {
  it('is a 1080 by 1920 story on a dark background', () => {
    const layout = layoutStory(input(teams(2, 7)), measure);
    expect([layout.width, layout.height]).toEqual([1080, 1920]);
    expect([STORY_WIDTH, STORY_HEIGHT]).toEqual([1080, 1920]);
    expect(layout.background).toBe('#1b2a41');
  });

  it('draws one block per team, in order, in the color of the team', () => {
    const { blocks } = groups(layoutStory(input(teams(4, 6)), measure));
    expect(blocks.map((b) => b.rect.fill)).toEqual(COLORS.slice(0, 4));
  });

  describe('where the blocks go', () => {
    it.each([2, 3])('stacks %i teams one under the other, as wide as the page allows', (count) => {
      const { blocks } = groups(layoutStory(input(teams(count, 7)), measure));
      for (const { rect } of blocks) {
        expect([rect.x, rect.width]).toEqual([MARGIN, STORY_WIDTH - 2 * MARGIN]);
      }
      const tops = blocks.map((b) => b.rect.y);
      expect([...tops].sort((a, b) => a - b)).toEqual(tops);
      expect(new Set(blocks.map((b) => b.rect.height)).size).toBe(1);
    });

    it('keeps 3 teams stacked while their names stay big enough to read', () => {
      for (const size of [3, 5, 7, 8]) {
        const { blocks } = groups(layoutStory(input(teams(3, size)), measure));
        expect(new Set(blocks.map((b) => b.rect.x)), `${size} players`).toEqual(new Set([MARGIN]));
      }
    });

    it('puts 3 teams with many players in two columns, the last one centered', () => {
      const { blocks } = groups(layoutStory(input(teams(3, 11)), measure));
      expect(blocks[0].rect.y).toBe(blocks[1].rect.y);
      expect(blocks[0].rect.x).toBeLessThan(blocks[1].rect.x);
      expect(blocks[2].rect.y).toBeGreaterThan(blocks[0].rect.y);
      expect(blocks[2].rect.x).toBeCloseTo((STORY_WIDTH - blocks[2].rect.width) / 2, 5);
    });

    it('gives names of a readable size in that case', () => {
      const first = groups(layoutStory(input(teams(3, 11)), measure)).blocks[0].texts[1];
      expect(first.size).toBeGreaterThanOrEqual(36);
    });

    it('puts 4 teams in a grid of 2 by 2, with blocks of the same size', () => {
      const { blocks } = groups(layoutStory(input(teams(4, 6)), measure));
      expect(new Set(blocks.map((b) => b.rect.x)).size).toBe(2);
      expect(new Set(blocks.map((b) => b.rect.y)).size).toBe(2);
      expect(new Set(blocks.map((b) => b.rect.width)).size).toBe(1);
      expect(new Set(blocks.map((b) => b.rect.height)).size).toBe(1);
      expect(blocks[0].rect.y).toBe(blocks[1].rect.y);
      expect(blocks[2].rect.y).toBe(blocks[3].rect.y);
    });

    it('centers the last block when a grid row is not full', () => {
      const { blocks } = groups(layoutStory(input(teams(5, 6)), measure));
      const last = blocks[4].rect;
      expect(last.x).toBeCloseTo((STORY_WIDTH - last.width) / 2, 5);
    });

    it('keeps every block inside the margins and away from every other block', () => {
      for (let count = 1; count <= 6; count++) {
        for (const size of [0, 1, 5, 11]) {
          for (const extra of [{}, { header: 'Header', footer: 'Footer' }]) {
            const label = `${count} teams of ${size}, ${JSON.stringify(extra)}`;
            const { blocks } = groups(layoutStory(input(teams(count, size), extra), measure));
            for (const { rect } of blocks) {
              expect(rect.x, label).toBeGreaterThanOrEqual(MARGIN);
              expect(rect.y, label).toBeGreaterThanOrEqual(MARGIN);
              expect(rect.x + rect.width, label).toBeLessThanOrEqual(STORY_WIDTH - MARGIN);
              expect(rect.y + rect.height, label).toBeLessThanOrEqual(STORY_HEIGHT - MARGIN);
            }
            blocks.forEach((a, i) =>
              blocks
                .slice(i + 1)
                .forEach((b) => expect(overlap(a.rect, b.rect), label).toBe(false)),
            );
          }
        }
      }
    });
  });

  describe('what is in each block', () => {
    it('starts with the title, then lists the players in order', () => {
      const { blocks } = groups(layoutStory(input([team(0, 3, 1), team(1, 3)]), measure));
      expect(blocks[0].texts.map((t) => t.text)).toEqual([
        'Team 1',
        '1. Player 1 🧤',
        '2. Player 2',
        '3. Player 3',
      ]);
      expect(blocks[1].texts[0].text).toBe('Team 2');
    });

    it('marks the goalkeepers with a glove and nobody else', () => {
      const { blocks } = groups(layoutStory(input([team(0, 5, 2), team(1, 5, 0)]), measure));
      const gloves = blocks.map((b) => b.texts.filter((t) => t.text.endsWith('🧤')).length);
      expect(gloves).toEqual([2, 0]);
    });

    it.each([
      ['dot', '1. Player 1'],
      ['paren', '1) Player 1'],
      ['dash', '1- Player 1'],
      ['none', 'Player 1'],
    ] as const)('numbers the players with the %s style', (numbering, first) => {
      const { blocks } = groups(
        layoutStory(input([team(0, 3), team(1, 3)], { numbering }), measure),
      );
      expect(blocks[1].texts[1].text).toBe(first);
    });

    it('writes the title in bold and the players in regular, in a readable color', () => {
      const { blocks } = groups(layoutStory(input(teams(4, 6)), measure));
      blocks.forEach(({ rect, texts }) => {
        const [title, ...rows] = texts;
        expect(title.weight).toBe('bold');
        expect(rows.every((r) => r.weight === 'normal')).toBe(true);
        for (const text of texts) expect(text.color).toBe(readableTextColor(rect.fill));
      });
    });

    it('keeps every text of a block inside that block', () => {
      for (const count of [2, 3, 4]) {
        for (const size of [3, 7, 11]) {
          const { blocks } = groups(
            layoutStory(input(teams(count, size), { header: 'H', footer: 'F' }), measure),
          );
          for (const { rect, texts } of blocks) {
            for (const text of texts) {
              const label = `${count} teams of ${size}: ${text.text}`;
              expect(text.y - text.size / 2, label).toBeGreaterThanOrEqual(rect.y);
              expect(text.y + text.size / 2, label).toBeLessThanOrEqual(rect.y + rect.height);
              expect(text.x, label).toBeGreaterThanOrEqual(rect.x);
              expect(
                text.x + measure(text.text, text.size, text.weight),
                label,
              ).toBeLessThanOrEqual(rect.x + rect.width);
            }
          }
        }
      }
    });

    it('lists the players from top to bottom without overlapping lines', () => {
      const { blocks } = groups(layoutStory(input(teams(4, 11)), measure));
      for (const { texts } of blocks) {
        const rows = texts.slice(1);
        rows
          .slice(1)
          .forEach((row, i) => expect(row.y - rows[i].y).toBeGreaterThanOrEqual(row.size));
      }
    });
  });

  describe('the size of the names', () => {
    const sizes = (layout: StoryLayout) =>
      groups(layout).blocks.flatMap((b) => b.texts.slice(1).map((t) => t.size));

    it('is the same for every name of every team', () => {
      expect(new Set(sizes(layoutStory(input(teams(4, 9)), measure))).size).toBe(1);
    });

    it('is the biggest when there are few players', () => {
      expect(sizes(layoutStory(input(teams(2, 3)), measure))[0]).toBe(52);
    });

    it('shrinks as more players have to fit, and never below a readable size', () => {
      const few = sizes(layoutStory(input(teams(3, 5)), measure))[0];
      const many = sizes(
        layoutStory(input(teams(3, 11), { header: 'H', footer: 'F' }), measure),
      )[0];
      expect(many).toBeLessThan(few);
      expect(many).toBeGreaterThanOrEqual(22);
    });

    it('is worked out from the longest team when the teams are not the same size', () => {
      // 3 teams stacked with 9 players: the names are well below the biggest size, so the
      // size depends on the longest team and not on the first one.
      const uneven = layoutStory(input([team(0, 3), team(1, 9), team(2, 9)]), measure);
      const even = layoutStory(input([team(0, 9), team(1, 9), team(2, 9)]), measure);
      expect(sizes(uneven)[0]).toBe(sizes(even)[0]);
      expect(sizes(even)[0]).toBeLessThan(52);
    });
  });

  describe('long texts', () => {
    it('cuts a name that does not fit and ends it with an ellipsis', () => {
      const long: StoryTeam = {
        ...team(0, 2),
        players: [{ name: 'A'.repeat(90), isGoalkeeper: false }],
      };
      const { blocks } = groups(layoutStory(input([long, team(1, 2)]), measure));
      const name = blocks[0].texts[1];
      expect(name.text.endsWith('…')).toBe(true);
      expect(measure(name.text, name.size, name.weight)).toBeLessThanOrEqual(
        STORY_WIDTH - 2 * MARGIN - 64,
      );
    });

    it('keeps the glove of a goalkeeper whose long name is cut', () => {
      const long: StoryTeam = {
        ...team(0, 2),
        players: [{ name: 'A'.repeat(90), isGoalkeeper: true }],
      };
      const { blocks } = groups(layoutStory(input([long, team(1, 2)]), measure));
      const name = blocks[0].texts[1];
      expect(name.text).toMatch(/^1\. A+… 🧤$/);
      expect(measure(name.text, name.size, name.weight)).toBeLessThanOrEqual(
        STORY_WIDTH - 2 * MARGIN - 64,
      );
    });

    it('leaves a name that fits exactly as it is', () => {
      const { blocks } = groups(layoutStory(input(teams(2, 5)), measure));
      expect(blocks[1].texts.every((t) => !t.text.includes('…'))).toBe(true);
    });

    it('cuts a title that does not fit', () => {
      const long: StoryTeam = { ...team(0, 2), title: 'T'.repeat(120) };
      const { blocks } = groups(layoutStory(input([long, team(1, 2)]), measure));
      expect(blocks[0].texts[0].text.endsWith('…')).toBe(true);
    });
  });

  describe('the header and the footer', () => {
    const lines = (layout: StoryLayout) => groups(layout).before;

    it('has only the brand when there is no header or footer, or they are blank', () => {
      expect(lines(layoutStory(input(teams(2, 7)), measure))).toHaveLength(1);
      expect(
        lines(layoutStory(input(teams(2, 7), { header: '   ', footer: '\t' }), measure)),
      ).toHaveLength(1);
    });

    it('writes a short header on one centered bold line at the top', () => {
      const layout = layoutStory(input(teams(2, 7), { header: '⚽ Amistoso del jueves' }), measure);
      const header = lines(layout).find((t) => t.text.includes('Amistoso')) as TextCommand;
      expect(header.align).toBe('center');
      expect(header.x).toBe(STORY_WIDTH / 2);
      expect(header.weight).toBe('bold');
      expect(header.color).toBe('#ffffff');
      expect(header.size).toBe(64);
      expect(header.y).toBeLessThan(MARGIN + 100);
    });

    it('prefers one line a little smaller to a second line with a single word', () => {
      const layout = layoutStory(
        input(teams(2, 7), { header: 'Amistoso del jueves en la cancha' }),
        measure,
      );
      const header = lines(layout).filter((t) => t.weight === 'bold');
      expect(header).toHaveLength(1);
      expect(header[0].size).toBeLessThan(64);
      expect(header[0].size).toBeGreaterThanOrEqual(45);
    });

    it('goes to two lines, at the biggest size that fits, when one would be too small', () => {
      const layout = layoutStory(
        input(teams(2, 7), { header: 'palabra '.repeat(7).trim() }),
        measure,
      );
      const header = lines(layout).filter((t) => t.weight === 'bold');
      expect(header).toHaveLength(2);
      expect(header[0].size).toBeGreaterThan(45);
      for (const line of header) {
        expect(measure(line.text, line.size, line.weight)).toBeLessThanOrEqual(
          STORY_WIDTH - 2 * MARGIN,
        );
      }
    });

    it('puts the teams below the header and above the footer', () => {
      const layout = layoutStory(
        input(teams(3, 6), { header: 'Header', footer: 'Footer' }),
        measure,
      );
      const { before, blocks } = groups(layout);
      const header = before.find((t) => t.text === 'Header') as TextCommand;
      const footer = before.find((t) => t.text === 'Footer') as TextCommand;
      const top = Math.min(...blocks.map((b) => b.rect.y));
      const bottom = Math.max(...blocks.map((b) => b.rect.y + b.rect.height));
      expect(header.y + header.size / 2).toBeLessThanOrEqual(top);
      expect(footer.y - footer.size / 2).toBeGreaterThanOrEqual(bottom);
    });

    it('wraps a long text in at most two lines, each one inside the page', () => {
      const long =
        'Amistoso de los jueves en la cancha de siempre, traer camiseta clara y oscura '.repeat(3);
      const layout = layoutStory(input(teams(2, 7), { header: long.trim() }), measure);
      const header = lines(layout).filter((t) => t.weight === 'bold');
      expect(header.length).toBeLessThanOrEqual(2);
      expect(header.length).toBeGreaterThan(0);
      for (const line of header) {
        expect(measure(line.text, line.size, line.weight)).toBeLessThanOrEqual(
          STORY_WIDTH - 2 * MARGIN,
        );
      }
    });

    it('ends the last line with an ellipsis when the text is still too long', () => {
      const layout = layoutStory(
        input(teams(2, 7), { header: 'palabra '.repeat(40).trim() }),
        measure,
      );
      const header = lines(layout).filter((t) => t.weight === 'bold');
      expect(header.at(-1)?.text.endsWith('…')).toBe(true);
    });

    it('writes the footer centered at the bottom, above the brand', () => {
      const layout = layoutStory(input(teams(2, 7), { footer: 'Confirmen asistencia' }), measure);
      const all = lines(layout);
      const footer = all.find((t) => t.text === 'Confirmen asistencia') as TextCommand;
      const brand = all.find((t) => t.text === 'Kora Roster') as TextCommand;
      expect(footer.align).toBe('center');
      expect(footer.x).toBe(STORY_WIDTH / 2);
      expect(footer.y).toBeLessThan(brand.y);
    });
  });

  describe('the brand', () => {
    it('is a small "Kora Roster" centered at the very bottom, below everything else', () => {
      const layout = layoutStory(input(teams(2, 7), { footer: 'Footer' }), measure);
      const all = layout.commands.filter((c): c is TextCommand => c.kind === 'text');
      const brand = all.find((t) => t.text === 'Kora Roster') as TextCommand;
      expect([brand.align, brand.x, brand.size]).toEqual(['center', STORY_WIDTH / 2, 30]);
      expect(brand.y).toBe(Math.max(...all.map((t) => t.y)));
      expect(brand.y + brand.size / 2).toBeLessThanOrEqual(STORY_HEIGHT - MARGIN + 4);
    });
  });

  describe('the layout as a whole', () => {
    it('never draws anything outside the page', () => {
      for (const count of [1, 2, 3, 4, 5, 6]) {
        const layout = layoutStory(
          input(teams(count, 11), { header: 'h'.repeat(200), footer: 'f'.repeat(200) }),
          measure,
        );
        for (const command of layout.commands) {
          if (command.kind === 'rect') {
            expect(command.x + command.width).toBeLessThanOrEqual(STORY_WIDTH);
            expect(command.y + command.height).toBeLessThanOrEqual(STORY_HEIGHT);
          } else {
            expect(command.y).toBeGreaterThan(0);
            expect(command.y).toBeLessThan(STORY_HEIGHT);
            expect(command.x).toBeGreaterThanOrEqual(0);
            expect(command.x).toBeLessThanOrEqual(STORY_WIDTH);
          }
        }
      }
    });

    it('still draws a team with no players', () => {
      const { blocks } = groups(layoutStory(input([team(0, 0), team(1, 4)]), measure));
      expect(blocks).toHaveLength(2);
      expect(blocks[0].texts).toHaveLength(1);
    });

    it('gives the same layout for the same input and does not touch the input', () => {
      const frozen = Object.freeze(
        input(teams(3, 6).map((t) => Object.freeze({ ...t, players: Object.freeze(t.players) }))),
      );
      expect(layoutStory(frozen, measure)).toEqual(layoutStory(frozen, measure));
    });
  });
});
