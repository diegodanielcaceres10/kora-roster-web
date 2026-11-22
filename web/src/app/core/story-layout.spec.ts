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
// The story is a white plate on a light page: 36 px of page around it and 40 px inside it.
const PLATE_MARGIN = 36;
const INNER_LEFT = PLATE_MARGIN + 40;
const INNER_WIDTH = STORY_WIDTH - 2 * INNER_LEFT;
const INK = '#1b2a41';

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
  confirmed: 'confirmed',
  brand: 'Made with Kora Roster',
  ...extra,
});

// Every command says what it is for, so these find them without depending on the order.
const rects = (layout: StoryLayout, role: RectCommand['role']) =>
  layout.commands.filter((c): c is RectCommand => c.kind === 'rect' && c.role === role);
const texts = (layout: StoryLayout, role: TextCommand['role']) =>
  layout.commands.filter((c): c is TextCommand => c.kind === 'text' && c.role === role);
const panels = (layout: StoryLayout) => rects(layout, 'panel');
const teamTexts = (layout: StoryLayout, index: number, role: 'title' | 'player') =>
  texts(layout, role).filter((t) => t.team === index);
const names = (layout: StoryLayout) => texts(layout, 'player');

const overlap = (a: RectCommand, b: RectCommand) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe('layoutStory', () => {
  describe('the page', () => {
    it('is a 1080 by 1920 story on a light background', () => {
      const layout = layoutStory(input(teams(2, 7)), measure);
      expect([layout.width, layout.height]).toEqual([1080, 1920]);
      expect([STORY_WIDTH, STORY_HEIGHT]).toEqual([1080, 1920]);
      expect(layout.background).toBe('#eef2f7');
    });

    it('has a white plate with rounded corners inside the page', () => {
      const [plate, ...others] = rects(layoutStory(input(teams(2, 7)), measure), 'plate');
      expect(others).toHaveLength(0);
      expect([plate.x, plate.y]).toEqual([PLATE_MARGIN, PLATE_MARGIN]);
      expect(plate.width).toBe(STORY_WIDTH - 2 * PLATE_MARGIN);
      expect(plate.height).toBe(STORY_HEIGHT - 2 * PLATE_MARGIN);
      expect(plate.fill).toBe('#ffffff');
      expect(plate.radius).toBeGreaterThan(0);
    });

    it('is the first thing drawn, so that everything else goes on top of it', () => {
      const layout = layoutStory(input(teams(2, 7)), measure);
      expect(layout.commands[0]).toMatchObject({ kind: 'rect', role: 'plate' });
    });
  });

  describe('the pills on top', () => {
    const pills = (layout: StoryLayout) => ({
      brandRect: rects(layout, 'brand-pill')[0],
      brandText: texts(layout, 'brand-pill')[0],
      statusRect: rects(layout, 'status-pill')[0],
      statusText: texts(layout, 'status-pill')[0],
    });

    it('has the brand at the left, in capitals', () => {
      const { brandRect, brandText } = pills(layoutStory(input(teams(2, 7)), measure));
      expect(brandText.text).toBe('KORA ROSTER');
      expect(brandRect.x).toBe(INNER_LEFT);
      expect(brandText.x).toBeCloseTo(brandRect.x + brandRect.width / 2, 5);
      expect(brandText.align).toBe('center');
    });

    it('says what the teams are at the right: their size and that they are confirmed', () => {
      const { statusRect, statusText } = pills(layoutStory(input(teams(2, 7)), measure));
      expect(statusText.text).toBe('7V7 CONFIRMED');
      expect(statusRect.x + statusRect.width).toBeCloseTo(INNER_LEFT + INNER_WIDTH, 5);
    });

    it('takes the size from the longest team when they are not the same size', () => {
      const { statusText } = pills(layoutStory(input([team(0, 5), team(1, 6)]), measure));
      expect(statusText.text).toBe('6V6 CONFIRMED');
    });

    it('says only that the teams are confirmed when there are no players', () => {
      const { statusText } = pills(layoutStory(input([team(0, 0), team(1, 0)]), measure));
      expect(statusText.text).toBe('CONFIRMED');
    });

    it('leaves the pill out when there is nothing to say', () => {
      const layout = layoutStory(input([team(0, 0)], { confirmed: '  ' }), measure);
      expect(rects(layout, 'status-pill')).toHaveLength(0);
    });

    it('keeps both pills on the same row, with each text in the middle of its pill', () => {
      const { brandRect, brandText, statusRect, statusText } = pills(
        layoutStory(input(teams(2, 7)), measure),
      );
      expect(brandRect.y).toBe(statusRect.y);
      expect(brandText.y).toBeCloseTo(brandRect.y + brandRect.height / 2, 5);
      expect(statusText.y).toBeCloseTo(statusRect.y + statusRect.height / 2, 5);
    });

    it('makes each pill wide enough for its text', () => {
      const { brandRect, brandText, statusRect, statusText } = pills(
        layoutStory(input(teams(2, 7)), measure),
      );
      for (const [rect, text] of [
        [brandRect, brandText],
        [statusRect, statusText],
      ] as const) {
        expect(rect.width).toBeGreaterThan(measure(text.text, text.size, text.weight));
      }
    });
  });

  describe('the panels', () => {
    it('are one per team, in order, with a border in the color of the team', () => {
      const layout = layoutStory(input(teams(4, 6)), measure);
      expect(panels(layout).map((p) => p.stroke?.color)).toEqual(COLORS.slice(0, 4));
      expect(panels(layout).every((p) => p.fill === '#ffffff')).toBe(true);
    });

    it('have a bar with the title in the color of the team', () => {
      const layout = layoutStory(input(teams(4, 6)), measure);
      expect(rects(layout, 'title-bar').map((b) => b.fill)).toEqual(COLORS.slice(0, 4));
    });

    describe('where they go', () => {
      it.each([2, 3])('stacks %i teams one under the other, as wide as the plate allows', (count) => {
        const found = panels(layoutStory(input(teams(count, 7)), measure));
        for (const rect of found) {
          expect([rect.x, rect.width]).toEqual([INNER_LEFT, INNER_WIDTH]);
        }
        const tops = found.map((p) => p.y);
        expect([...tops].sort((a, b) => a - b)).toEqual(tops);
        expect(new Set(found.map((p) => p.height)).size).toBe(1);
      });

      it('keeps 3 teams stacked while their names stay big enough to read', () => {
        for (const size of [3, 5, 7, 8]) {
          const found = panels(layoutStory(input(teams(3, size)), measure));
          expect(new Set(found.map((p) => p.x)), `${size} players`).toEqual(new Set([INNER_LEFT]));
        }
      });

      it('puts 3 teams with many players in two columns, the last one centered', () => {
        const found = panels(layoutStory(input(teams(3, 11)), measure));
        expect(found[0].y).toBe(found[1].y);
        expect(found[0].x).toBeLessThan(found[1].x);
        expect(found[2].y).toBeGreaterThan(found[0].y);
        expect(found[2].x).toBeCloseTo((STORY_WIDTH - found[2].width) / 2, 5);
      });

      it('gives names of a readable size in that case', () => {
        expect(names(layoutStory(input(teams(3, 11)), measure))[0].size).toBeGreaterThanOrEqual(36);
      });

      it('puts 4 teams in a grid of 2 by 2, with panels of the same size', () => {
        const found = panels(layoutStory(input(teams(4, 6)), measure));
        expect(new Set(found.map((p) => p.x)).size).toBe(2);
        expect(new Set(found.map((p) => p.y)).size).toBe(2);
        expect(new Set(found.map((p) => p.width)).size).toBe(1);
        expect(new Set(found.map((p) => p.height)).size).toBe(1);
        expect(found[0].y).toBe(found[1].y);
        expect(found[2].y).toBe(found[3].y);
      });

      it('centers the last panel when a grid row is not full', () => {
        const found = panels(layoutStory(input(teams(5, 6)), measure));
        expect(found[4].x).toBeCloseTo((STORY_WIDTH - found[4].width) / 2, 5);
      });

      it('keeps every panel inside the plate and away from every other panel', () => {
        for (let count = 1; count <= 6; count++) {
          for (const size of [0, 1, 5, 11]) {
            for (const extra of [{}, { header: 'Header', footer: 'Footer' }]) {
              const label = `${count} teams of ${size}, ${JSON.stringify(extra)}`;
              const found = panels(layoutStory(input(teams(count, size), extra), measure));
              for (const rect of found) {
                expect(rect.x, label).toBeGreaterThanOrEqual(INNER_LEFT);
                expect(rect.y, label).toBeGreaterThanOrEqual(PLATE_MARGIN);
                expect(rect.x + rect.width, label).toBeLessThanOrEqual(INNER_LEFT + INNER_WIDTH);
                expect(rect.y + rect.height, label).toBeLessThanOrEqual(
                  STORY_HEIGHT - PLATE_MARGIN,
                );
              }
              found.forEach((a, i) =>
                found.slice(i + 1).forEach((b) => expect(overlap(a, b), label).toBe(false)),
              );
            }
          }
        }
      });
    });

    describe('what is in each one', () => {
      it('starts with the title, then lists the players in order', () => {
        const layout = layoutStory(input([team(0, 3, 1), team(1, 3)]), measure);
        expect(teamTexts(layout, 0, 'title').map((t) => t.text)).toEqual(['Team 1']);
        expect(teamTexts(layout, 0, 'player').map((t) => t.text)).toEqual([
          '1. Player 1 🧤',
          '2. Player 2',
          '3. Player 3',
        ]);
        expect(teamTexts(layout, 1, 'title')[0].text).toBe('Team 2');
      });

      it('marks the goalkeepers with a glove and nobody else', () => {
        const layout = layoutStory(input([team(0, 5, 2), team(1, 5, 0)]), measure);
        const gloves = [0, 1].map(
          (i) => teamTexts(layout, i, 'player').filter((t) => t.text.endsWith('🧤')).length,
        );
        expect(gloves).toEqual([2, 0]);
      });

      it('also marks a goalkeeper with a tinted row behind the name', () => {
        const layout = layoutStory(input([team(0, 5, 2), team(1, 5, 0)]), measure);
        const rows = rects(layout, 'highlight');
        expect(rows.map((r) => r.team)).toEqual([0, 0]);
        // The tint is the color of the team, see through, so the name stays readable.
        expect(rows.every((r) => /^rgba\(229, 57, 53, 0\.\d+\)$/.test(r.fill))).toBe(true);
      });

      it('puts the tinted row exactly behind the name of the goalkeeper', () => {
        const layout = layoutStory(input([team(0, 4, 1), team(1, 4)]), measure);
        const [row] = rects(layout, 'highlight');
        const keeper = teamTexts(layout, 0, 'player')[0];
        expect(keeper.y).toBeGreaterThan(row.y);
        expect(keeper.y).toBeLessThan(row.y + row.height);
      });

      it.each([
        ['dot', '1. Player 1'],
        ['paren', '1) Player 1'],
        ['dash', '1- Player 1'],
        ['none', 'Player 1'],
      ] as const)('numbers the players with the %s style', (numbering, first) => {
        const layout = layoutStory(input([team(0, 3), team(1, 3)], { numbering }), measure);
        expect(teamTexts(layout, 1, 'player')[0].text).toBe(first);
      });

      it('writes the title in bold in a color readable on its bar', () => {
        const layout = layoutStory(input(teams(4, 6)), measure);
        texts(layout, 'title').forEach((title) => {
          expect(title.weight).toBe('bold');
          expect(title.color).toBe(readableTextColor(COLORS[title.team as number]));
        });
      });

      it('writes the players in the ink color, regular and in bold only the goalkeepers', () => {
        const layout = layoutStory(input([team(0, 4, 1), team(1, 4)]), measure);
        for (const name of names(layout)) {
          expect(name.color).toBe(INK);
          expect(name.weight).toBe(name.text.endsWith('🧤') ? 'bold' : 'normal');
        }
      });

      it('keeps every text of a panel inside that panel', () => {
        for (const count of [2, 3, 4]) {
          for (const size of [3, 7, 11]) {
            const layout = layoutStory(
              input(teams(count, size), { header: 'H', footer: 'F' }),
              measure,
            );
            panels(layout).forEach((rect, index) => {
              for (const text of [
                ...teamTexts(layout, index, 'title'),
                ...teamTexts(layout, index, 'player'),
              ]) {
                const label = `${count} teams of ${size}: ${text.text}`;
                expect(text.y - text.size / 2, label).toBeGreaterThanOrEqual(rect.y);
                expect(text.y + text.size / 2, label).toBeLessThanOrEqual(rect.y + rect.height);
                expect(text.x, label).toBeGreaterThanOrEqual(rect.x);
                expect(
                  text.x + measure(text.text, text.size, text.weight),
                  label,
                ).toBeLessThanOrEqual(rect.x + rect.width);
              }
            });
          }
        }
      });

      it('keeps the title inside its bar, and the bar inside the panel, above the players', () => {
        const layout = layoutStory(input(teams(3, 6)), measure);
        const bars = rects(layout, 'title-bar');
        panels(layout).forEach((panel, i) => {
          const bar = bars[i];
          const title = teamTexts(layout, i, 'title')[0];
          expect(bar.y).toBeGreaterThanOrEqual(panel.y);
          expect(bar.x + bar.width).toBeLessThanOrEqual(panel.x + panel.width);
          expect(bar.y + bar.height).toBeLessThanOrEqual(panel.y + panel.height);
          expect(title.y).toBeGreaterThan(bar.y);
          expect(title.y).toBeLessThan(bar.y + bar.height);
          expect(teamTexts(layout, i, 'player')[0].y).toBeGreaterThan(bar.y + bar.height);
        });
      });

      it('lists the players from top to bottom without overlapping lines', () => {
        const layout = layoutStory(input(teams(4, 11)), measure);
        for (let i = 0; i < 4; i++) {
          const rows = teamTexts(layout, i, 'player');
          rows
            .slice(1)
            .forEach((row, k) => expect(row.y - rows[k].y).toBeGreaterThanOrEqual(row.size));
        }
      });
    });
  });

  describe('the size of the names', () => {
    const sizes = (layout: StoryLayout) => names(layout).map((t) => t.size);

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
      // With 11 players the names are well below the biggest size, so the size depends on the
      // longest team and not on the first one.
      const uneven = layoutStory(input([team(0, 3), team(1, 11), team(2, 11)]), measure);
      const even = layoutStory(input([team(0, 11), team(1, 11), team(2, 11)]), measure);
      expect(sizes(uneven)[0]).toBe(sizes(even)[0]);
      expect(sizes(even)[0]).toBeLessThan(52);
    });
  });

  describe('long texts', () => {
    const roomForText = (layout: StoryLayout) => panels(layout)[0].width - 2 * (14 + 22);

    it('cuts a name that does not fit and ends it with an ellipsis', () => {
      const long: StoryTeam = {
        ...team(0, 2),
        players: [{ name: 'A'.repeat(90), isGoalkeeper: false }],
      };
      const layout = layoutStory(input([long, team(1, 2)]), measure);
      const name = teamTexts(layout, 0, 'player')[0];
      expect(name.text.endsWith('…')).toBe(true);
      expect(measure(name.text, name.size, name.weight)).toBeLessThanOrEqual(roomForText(layout));
    });

    it('keeps the glove of a goalkeeper whose long name is cut', () => {
      const long: StoryTeam = {
        ...team(0, 2),
        players: [{ name: 'A'.repeat(90), isGoalkeeper: true }],
      };
      const layout = layoutStory(input([long, team(1, 2)]), measure);
      const name = teamTexts(layout, 0, 'player')[0];
      expect(name.text).toMatch(/^1\. A+… 🧤$/);
      expect(measure(name.text, name.size, name.weight)).toBeLessThanOrEqual(roomForText(layout));
    });

    it('leaves a name that fits exactly as it is', () => {
      const layout = layoutStory(input(teams(2, 5)), measure);
      expect(teamTexts(layout, 1, 'player').every((t) => !t.text.includes('…'))).toBe(true);
    });

    it('cuts a title that does not fit', () => {
      const long: StoryTeam = { ...team(0, 2), title: 'T'.repeat(120) };
      const layout = layoutStory(input([long, team(1, 2)]), measure);
      expect(teamTexts(layout, 0, 'title')[0].text.endsWith('…')).toBe(true);
    });
  });

  describe('the header and the footer', () => {
    it('has neither when there is no text or it is blank', () => {
      expect(texts(layoutStory(input(teams(2, 7)), measure), 'header')).toHaveLength(0);
      expect(texts(layoutStory(input(teams(2, 7)), measure), 'footer')).toHaveLength(0);
      const blank = layoutStory(input(teams(2, 7), { header: '   ', footer: '\t' }), measure);
      expect(texts(blank, 'header')).toHaveLength(0);
      expect(texts(blank, 'footer')).toHaveLength(0);
    });

    it('writes a short header on one centered bold line under the pills, in the ink color', () => {
      const layout = layoutStory(input(teams(2, 7), { header: '⚽ Amistoso del jueves' }), measure);
      const [header] = texts(layout, 'header');
      const pill = rects(layout, 'brand-pill')[0];
      expect(header.align).toBe('center');
      expect(header.x).toBe(STORY_WIDTH / 2);
      expect(header.weight).toBe('bold');
      expect(header.color).toBe(INK);
      expect(header.size).toBe(64);
      expect(header.y - header.size / 2).toBeGreaterThanOrEqual(pill.y + pill.height);
    });

    it('prefers one line a little smaller to a second line with a single word', () => {
      const layout = layoutStory(
        input(teams(2, 7), { header: 'Amistoso del jueves en la cancha' }),
        measure,
      );
      const header = texts(layout, 'header');
      expect(header).toHaveLength(1);
      expect(header[0].size).toBeLessThan(64);
      expect(header[0].size).toBeGreaterThanOrEqual(45);
    });

    it('goes to two lines, at the biggest size that fits, when one would be too small', () => {
      const layout = layoutStory(
        input(teams(2, 7), { header: 'palabra '.repeat(7).trim() }),
        measure,
      );
      const header = texts(layout, 'header');
      expect(header).toHaveLength(2);
      expect(header[0].size).toBeGreaterThan(45);
      for (const line of header) {
        expect(measure(line.text, line.size, line.weight)).toBeLessThanOrEqual(INNER_WIDTH);
      }
    });

    it('puts the panels below the header and above the footer', () => {
      const layout = layoutStory(
        input(teams(3, 6), { header: 'Header', footer: 'Footer' }),
        measure,
      );
      const [header] = texts(layout, 'header');
      const [footer] = texts(layout, 'footer');
      const top = Math.min(...panels(layout).map((p) => p.y));
      const bottom = Math.max(...panels(layout).map((p) => p.y + p.height));
      expect(header.y + header.size / 2).toBeLessThanOrEqual(top);
      expect(footer.y - footer.size / 2).toBeGreaterThanOrEqual(bottom);
    });

    it('wraps a long text in at most two lines, each one inside the plate', () => {
      const long =
        'Amistoso de los jueves en la cancha de siempre, traer camiseta clara y oscura '.repeat(3);
      const header = texts(layoutStory(input(teams(2, 7), { header: long.trim() }), measure), 'header');
      expect(header.length).toBeLessThanOrEqual(2);
      expect(header.length).toBeGreaterThan(0);
      for (const line of header) {
        expect(measure(line.text, line.size, line.weight)).toBeLessThanOrEqual(INNER_WIDTH);
      }
    });

    it('ends the last line with an ellipsis when the text is still too long', () => {
      const header = texts(
        layoutStory(input(teams(2, 7), { header: 'palabra '.repeat(40).trim() }), measure),
        'header',
      );
      expect(header.at(-1)?.text.endsWith('…')).toBe(true);
    });

    it('writes the footer centered at the bottom, above the brand', () => {
      const layout = layoutStory(input(teams(2, 7), { footer: 'Confirmen asistencia' }), measure);
      const [footer] = texts(layout, 'footer');
      const [brand] = texts(layout, 'brand');
      expect(footer.align).toBe('center');
      expect(footer.x).toBe(STORY_WIDTH / 2);
      expect(footer.color).toBe(INK);
      expect(footer.y).toBeLessThan(brand.y);
    });
  });

  describe('the brand at the bottom', () => {
    it('is the text given, in capitals, small and centered at the very bottom of the plate', () => {
      const layout = layoutStory(input(teams(2, 7), { footer: 'Footer' }), measure);
      const [brand] = texts(layout, 'brand');
      expect(brand.text).toBe('MADE WITH KORA ROSTER');
      expect([brand.align, brand.x]).toEqual(['center', STORY_WIDTH / 2]);
      expect(brand.size).toBeLessThanOrEqual(30);
      expect(brand.y).toBe(Math.max(...texts(layout, 'brand').map((t) => t.y)));
      const lowest = layout.commands
        .filter((c): c is TextCommand => c.kind === 'text')
        .filter((t) => t.role !== 'brand');
      expect(brand.y).toBeGreaterThan(Math.max(...lowest.map((t) => t.y)));
      expect(brand.y + brand.size / 2).toBeLessThanOrEqual(STORY_HEIGHT - PLATE_MARGIN);
    });
  });

  describe('the layout as a whole', () => {
    it('never draws anything outside the plate', () => {
      for (const count of [1, 2, 3, 4, 5, 6]) {
        const layout = layoutStory(
          input(teams(count, 11), { header: 'h'.repeat(200), footer: 'f'.repeat(200) }),
          measure,
        );
        for (const command of layout.commands) {
          if (command.role === 'plate') continue;
          if (command.kind === 'rect') {
            expect(command.x).toBeGreaterThanOrEqual(PLATE_MARGIN);
            expect(command.y).toBeGreaterThanOrEqual(PLATE_MARGIN);
            expect(command.x + command.width).toBeLessThanOrEqual(STORY_WIDTH - PLATE_MARGIN);
            expect(command.y + command.height).toBeLessThanOrEqual(STORY_HEIGHT - PLATE_MARGIN);
          } else {
            expect(command.y).toBeGreaterThan(PLATE_MARGIN);
            expect(command.y).toBeLessThan(STORY_HEIGHT - PLATE_MARGIN);
            expect(command.x).toBeGreaterThanOrEqual(PLATE_MARGIN);
            expect(command.x).toBeLessThanOrEqual(STORY_WIDTH - PLATE_MARGIN);
          }
        }
      }
    });

    it('still draws a team with no players', () => {
      const layout = layoutStory(input([team(0, 0), team(1, 4)]), measure);
      expect(panels(layout)).toHaveLength(2);
      expect(teamTexts(layout, 0, 'player')).toHaveLength(0);
      expect(teamTexts(layout, 0, 'title')).toHaveLength(1);
    });

    it('draws only the plate, the pills and the brand when there are no teams', () => {
      const layout = layoutStory(input([]), measure);
      expect(panels(layout)).toHaveLength(0);
      expect(rects(layout, 'plate')).toHaveLength(1);
      expect(texts(layout, 'brand')).toHaveLength(1);
    });

    it('gives the same layout for the same input and does not touch the input', () => {
      const frozen = Object.freeze(
        input(teams(3, 6).map((t) => Object.freeze({ ...t, players: Object.freeze(t.players) }))),
      );
      expect(layoutStory(frozen, measure)).toEqual(layoutStory(frozen, measure));
    });
  });
});
