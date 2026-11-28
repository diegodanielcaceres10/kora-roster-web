import { layoutStory } from './layout-story';
import { STORY_HEIGHT, STORY_WIDTH } from './metrics';
import type {
  ImageCommand,
  Measure,
  RectCommand,
  StoryInput,
  StoryLayout,
  StoryTeam,
  TextCommand,
} from './types';

// A made-up font where every character is as wide as 55% of its size.
const measure: Measure = (text, size) => text.length * size * 0.55;

const COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00'];
const PLATE_MARGIN = 36;
const INNER_LEFT = PLATE_MARGIN + 36;
const INNER_WIDTH = STORY_WIDTH - 2 * INNER_LEFT;

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
  location: '',
  footer: '',
  numbering: 'dot',
  confirmed: 'confirmed',
  brand: 'GENERADO CON KORA ROSTER',
  ...extra,
});

const images = (layout: StoryLayout, role: ImageCommand['role']) =>
  layout.commands.filter((c): c is ImageCommand => c.kind === 'image' && c.role === role);
const rects = (layout: StoryLayout, role: RectCommand['role']) =>
  layout.commands.filter((c): c is RectCommand => c.kind === 'rect' && c.role === role);
const texts = (layout: StoryLayout, role: TextCommand['role']) =>
  layout.commands.filter((c): c is TextCommand => c.kind === 'text' && c.role === role);
const panels = (layout: StoryLayout) => rects(layout, 'panel');
const teamTexts = (layout: StoryLayout, index: number, role: 'title' | 'player') =>
  texts(layout, role).filter((t) => t.team === index);

describe('layoutStory', () => {
  describe('the page and theme', () => {
    it('is a 1080 by 1920 story on a light background by default', () => {
      const layout = layoutStory(input(teams(2, 7)), measure);
      expect([layout.width, layout.height]).toEqual([1080, 1920]);
      expect([STORY_WIDTH, STORY_HEIGHT]).toEqual([1080, 1920]);
      expect(layout.background).toBe('#eef2f7');
    });

    it('adapts to dark theme when requested', () => {
      const layout = layoutStory(input(teams(2, 7), { theme: 'dark' }), measure);
      expect(layout.background).toBe('#0a0d12');
      const [plate] = rects(layout, 'plate');
      expect(plate.fill).toBe('#10141b');
    });

    it('has a plate with rounded corners, centered in the page and as tall as its content', () => {
      const [plate, ...others] = rects(layoutStory(input(teams(2, 7)), measure), 'plate');
      expect(others).toHaveLength(0);
      expect(plate.x).toBe(PLATE_MARGIN);
      expect(plate.width).toBe(STORY_WIDTH - 2 * PLATE_MARGIN);
      expect(plate.y).toBeGreaterThanOrEqual(PLATE_MARGIN);
      expect(plate.y + plate.height).toBeLessThanOrEqual(STORY_HEIGHT - PLATE_MARGIN);
      expect(plate.height).toBeLessThan(STORY_HEIGHT - 2 * PLATE_MARGIN);
      // Equal space above and below, allowing one pixel of rounding.
      const below = STORY_HEIGHT - (plate.y + plate.height);
      expect(Math.abs(plate.y - below)).toBeLessThanOrEqual(1);
      expect(plate.radius).toBeGreaterThan(0);
    });

    it('is the first thing drawn, so that everything else goes on top of it', () => {
      const layout = layoutStory(input(teams(2, 7)), measure);
      expect(layout.commands[0]).toMatchObject({ kind: 'rect', role: 'plate' });
    });
  });

  describe('the pills on top', () => {
    it('omits the status pill', () => {
      const layout = layoutStory(input(teams(2, 7)), measure);
      expect(rects(layout, 'status-pill')).toHaveLength(0);
      expect(texts(layout, 'status-pill')).toHaveLength(0);
    });
  });

  describe('the logo on top', () => {
    const logo = (extra: Partial<StoryInput> = {}, list = teams(2, 7)) => {
      const layout = layoutStory(input(list, extra), measure);
      return {
        layout,
        mark: images(layout, 'logo')[0],
        name: texts(layout, 'wordmark')[0],
        tagRect: rects(layout, 'brand-pill')[0],
        tagText: texts(layout, 'brand-pill')[0],
      };
    };

    it('starts with the mark of Kora at the left of the first row, square-sized', () => {
      const { mark } = logo();
      expect(mark.x).toBe(INNER_LEFT);
      expect(mark.width).toBe(mark.height);
    });

    it('writes KORA right after the mark, in capitals and aligned to the left', () => {
      const { mark, name } = logo();
      expect(name.text).toBe('KORA');
      expect(name.align).toBe('left');
      expect(name.x).toBeGreaterThan(mark.x + mark.width);
    });

    it('puts the Roster tag after the name, as a pill with its text at the center', () => {
      const { name, tagRect, tagText } = logo();
      expect(tagText.text).toBe('ROSTER');
      expect(tagRect.x).toBeGreaterThan(name.x + measure('KORA', name.size, name.weight));
      expect(tagText.align).toBe('center');
      expect(tagText.x).toBeCloseTo(tagRect.x + tagRect.width / 2, 5);
      expect(tagRect.radius).toBe(tagRect.height / 2);
    });

    it('keeps the three on one horizontal center line', () => {
      const { mark, name, tagRect, tagText } = logo();
      const center = mark.y + mark.height / 2;
      expect(name.y).toBeCloseTo(center, 5);
      expect(tagRect.y + tagRect.height / 2).toBeCloseTo(center, 5);
      expect(tagText.y).toBeCloseTo(center, 5);
    });

    it('makes the tag a little smaller than the row, so it reads as a tag of the name', () => {
      const { mark, tagRect } = logo();
      expect(tagRect.height).toBeLessThan(mark.height);
    });

    it('replaces the old pill that said KORA ROSTER', () => {
      const { layout } = logo();
      expect(texts(layout, 'brand-pill').map((t) => t.text)).toEqual(['ROSTER']);
      expect(rects(layout, 'brand-pill')).toHaveLength(1);
    });

    it('stays at the same place whatever the location, the numbering or the teams are', () => {
      const base = logo();
      const others = [
        logo({ location: 'Cancha Norte, Calle del Sol 5' }),
        logo({ numbering: 'none', footer: 'Bring water' }),
        logo({}, teams(3, 7)),
        logo({}, teams(4, 6)),
      ];
      for (const other of others) {
        expect([other.mark.x, other.name.x, other.tagRect.x]).toEqual([
          base.mark.x,
          base.name.x,
          base.tagRect.x,
        ]);
      }
    });

    it('is drawn for one team too', () => {
      const { mark, name, tagText } = logo({}, [team(0, 6)]);
      expect(mark).toBeDefined();
      expect(name.text).toBe('KORA');
      expect(tagText.text).toBe('ROSTER');
    });

    it('is drawn before the panels, on top of the plate', () => {
      const { layout, mark } = logo();
      const at = (command: unknown) => layout.commands.indexOf(command as never);
      expect(at(mark)).toBeGreaterThan(at(rects(layout, 'plate')[0]));
      expect(at(mark)).toBeLessThan(at(panels(layout)[0]));
    });

    it('takes the colors of the light and the dark theme', () => {
      const light = logo();
      const dark = logo({ theme: 'dark' });
      expect(light.name.color).toBe('#0f172a');
      expect(dark.name.color).toBe('#f8fafc');
      expect(light.tagRect.fill).not.toBe(dark.tagRect.fill);
      expect(light.tagText.color).not.toBe(dark.tagText.color);
    });

    it('leaves the empty story without a logo, as it has no content to frame', () => {
      const layout = layoutStory(input([]), measure);
      expect(images(layout, 'logo')).toHaveLength(0);
    });
  });

  describe('the matchday card (2 teams)', () => {
    it('creates a matchday VS card when exactly two teams are present', () => {
      const layout = layoutStory(input(teams(2, 7)), measure);
      const matchdayCards = rects(layout, 'matchday-card');
      expect(matchdayCards.length).toBeGreaterThan(0);
      const matchdayTexts = texts(layout, 'matchday');
      expect(matchdayTexts.some((t) => t.text === 'VS')).toBe(true);
      expect(matchdayTexts.some((t) => t.text === 'LADO A')).toBe(true);
      expect(matchdayTexts.some((t) => t.text === 'LADO B')).toBe(true);
    });

    it('does not create a matchday card when there are more than two teams', () => {
      const layout = layoutStory(input(teams(3, 5)), measure);
      expect(rects(layout, 'matchday-card')).toHaveLength(0);
    });
  });

  describe('the team panels and player rows', () => {
    it('creates panels for each team with their respective titles', () => {
      const layout = layoutStory(input(teams(2, 7)), measure);
      expect(panels(layout)).toHaveLength(2);
      expect(teamTexts(layout, 0, 'title')[0].text).toBe('TEAM 1');
      expect(teamTexts(layout, 1, 'title')[0].text).toBe('TEAM 2');
    });

    it('renders player rows and marks goalkeepers with a GK badge', () => {
      const layout = layoutStory(input([team(0, 5, 1), team(1, 5, 0)]), measure);
      const gkBadges = texts(layout, 'badge').filter((t) => t.text === 'GK');
      expect(gkBadges).toHaveLength(1);
      const highlights = rects(layout, 'highlight');
      expect(highlights).toHaveLength(1);
    });

    it('numbers the players according to numbering style', () => {
      const layout = layoutStory(input([team(0, 3), team(1, 3)], { numbering: 'dash' }), measure);
      const firstPlayer = teamTexts(layout, 0, 'player')[0];
      // The separator comes with a trailing space, which is shared with the WhatsApp text.
      expect(firstPlayer.text.trim()).toBe('1-');
    });

    it('does not truncate normal player names in team 2 with an ellipsis', () => {
      const layout = layoutStory(
        input([
          team(0, 8),
          {
            title: 'Equipo 2',
            color: '#1e88e5',
            players: [
              { name: 'N. Romero', isGoalkeeper: true },
              { name: 'F. Torres', isGoalkeeper: false },
            ],
          },
        ]),
        measure,
      );
      const team2Names = teamTexts(layout, 1, 'player').filter(
        (t) => t.text.includes('Romero') || t.text.includes('Torres'),
      );
      expect(team2Names[0].text).toBe('N. Romero');
      expect(team2Names[1].text).toBe('F. Torres');
    });
  });

  describe('the location card', () => {
    const GAP = 20;
    const PLACE = 'Cancha de ejemplo, Calle Principal 123. https://maps.app.goo.gl/ejemplo';
    const LONG = Array.from({ length: 30 }, (_, i) => `palabra${i}`).join(' ');

    const where = (extra: Partial<StoryInput> = {}, list = teams(2, 7)) => {
      const layout = layoutStory(input(list, { location: PLACE, ...extra }), measure);
      return {
        layout,
        card: rects(layout, 'location-card')[0],
        lines: texts(layout, 'location'),
        plate: rects(layout, 'plate')[0],
      };
    };

    it('shows a card with the location, as typed', () => {
      const { card, lines } = where();
      expect(card).toBeDefined();
      expect(lines.map((l) => l.text)).toEqual([PLACE]);
    });

    it('keeps the capitals and the link as they are, so a link still works', () => {
      const { lines } = where({ location: 'Cancha Norte https://Maps.App.goo.gl/AbC' });
      expect(lines[0].text).toBe('Cancha Norte https://Maps.App.goo.gl/AbC');
    });

    it.each([[''], ['   '], ['\n\t ']])('shows no card for a blank location: %j', (blank) => {
      const { card, lines } = where({ location: blank });
      expect(card).toBeUndefined();
      expect(lines).toHaveLength(0);
    });

    it('collapses the spaces and line breaks into single spaces', () => {
      const { lines } = where({ location: '  Cancha   Norte,\n Calle  1 ' });
      expect(lines[0].text).toBe('Cancha Norte, Calle 1');
    });

    it('goes right under the top row, as wide as the plate allows, with the gap in between', () => {
      const { card, layout } = where();
      const logo = images(layout, 'logo')[0];
      expect(card.x).toBe(INNER_LEFT);
      expect(card.width).toBe(INNER_WIDTH);
      expect(card.y - (logo.y + logo.height)).toBe(GAP);
    });

    it('is 56 px tall for one line, with the text centered and at the left', () => {
      const { card, lines } = where();
      expect(card.height).toBe(56);
      expect(lines[0].align).toBe('left');
      expect(lines[0].x).toBe(card.x + 20);
      expect(lines[0].y).toBe(card.y + card.height / 2);
    });

    it('is written in the normal weight and the colors of the info cards, light and dark', () => {
      const light = where();
      const dark = where({ theme: 'dark' });
      expect(light.lines[0].weight).toBe('normal');
      expect(light.lines[0].color).toBe('#1e293b');
      expect(dark.lines[0].color).toBe('#e2e8f0');
      expect(light.card.fill).toBe('#f8fafc');
      expect(dark.card.fill).toBe('#161b24');
    });

    it('goes on a second line when it does not fit in one, and the card grows with it', () => {
      const { card, lines } = where({
        location: Array.from({ length: 14 }, (_, i) => `calle${i}`).join(' '),
      });
      expect(lines).toHaveLength(2);
      expect(card.height).toBeGreaterThan(56);
      for (const line of lines) {
        expect(line.y).toBeGreaterThan(card.y);
        expect(line.y).toBeLessThan(card.y + card.height);
        expect(measure(line.text, line.size, line.weight)).toBeLessThanOrEqual(INNER_WIDTH - 40);
      }
      expect(lines[1].y).toBeGreaterThan(lines[0].y);
    });

    it('wraps long text across as many lines as needed without ellipsis', () => {
      const { lines } = where({ location: LONG });
      expect(lines.length).toBeGreaterThan(2);
      expect(lines.every((line) => !line.text.endsWith('…'))).toBe(true);
      for (const line of lines) {
        expect(measure(line.text, line.size, line.weight)).toBeLessThanOrEqual(INNER_WIDTH - 40);
      }
    });

    it('breaks a word wider than the line, such as a long link, without ellipsis', () => {
      const link = `https://maps.app.goo.gl/${'a'.repeat(200)}`;
      const { lines } = where({ location: link });
      expect(lines.length).toBeGreaterThan(2);
      expect(lines.every((line) => !line.text.endsWith('…'))).toBe(true);
      expect(lines.map((l) => l.text).join('')).toBe(link);
      for (const line of lines) {
        expect(measure(line.text, line.size, line.weight)).toBeLessThanOrEqual(INNER_WIDTH - 40);
      }
    });

    it('leaves the gap after it, and the plate grows by its height and the gap', () => {
      const base = where({ location: '' });
      const withIt = where();
      const matchday = rects(withIt.layout, 'matchday-card')[0];
      expect(matchday.y - (withIt.card.y + withIt.card.height)).toBe(GAP);
      expect(withIt.plate.height - base.plate.height).toBe(withIt.card.height + GAP);
    });

    it('leaves the gap before the first panel too, when there are three teams', () => {
      const { card, layout } = where({}, teams(3, 6));
      const first = panels(layout)[0];
      expect(first.y - (card.y + card.height)).toBe(GAP);
    });

    it('comes before the matchday card and the panels, in this order', () => {
      const { layout, card } = where();
      const at = (command: unknown) => layout.commands.indexOf(command as never);
      expect(at(card)).toBeLessThan(at(rects(layout, 'matchday-card')[0]));
      expect(at(card)).toBeLessThan(at(panels(layout)[0]));
    });

    it('keeps the whole plate inside the story, even with two lines and 11 players', () => {
      const { plate } = where({ location: LONG }, teams(2, 11));
      expect(plate.y).toBeGreaterThanOrEqual(0);
      expect(plate.y + plate.height).toBeLessThanOrEqual(STORY_HEIGHT);
    });

    it.each([[1], [3], [4]])('is drawn with %i teams as well', (count) => {
      const { card, lines } = where({}, teams(count, 6));
      expect(card).toBeDefined();
      expect(lines).toHaveLength(1);
    });

    it('is left out of the empty story, as it has no content to frame', () => {
      const layout = layoutStory(input([], { location: PLACE }), measure);
      expect(rects(layout, 'location-card')).toHaveLength(0);
      expect(texts(layout, 'location')).toHaveLength(0);
    });
  });

  describe('the header and footer of the preferences', () => {
    it('draws the header card above location and panels, wrapping without ellipsis', () => {
      const longHeader = Array.from({ length: 18 }, (_, i) => `Partido${i}`).join(' ');
      const layout = layoutStory(input(teams(2, 7), { header: longHeader, location: 'Cancha 1' }), measure);
      const card = rects(layout, 'header-card')[0];
      const lines = texts(layout, 'header');
      expect(card).toBeDefined();
      expect(lines.length).toBeGreaterThan(1);
      expect(lines.every((l) => !l.text.endsWith('…'))).toBe(true);
      expect(card.y + card.height).toBeLessThan(rects(layout, 'location-card')[0].y);
    });

    it('draws the footer message above the brand line, wrapping without ellipsis', () => {
      const longFooter = Array.from({ length: 18 }, (_, i) => `Confirmar${i}`).join(' ');
      const layout = layoutStory(input(teams(2, 7), { footer: longFooter }), measure);
      const footerLines = texts(layout, 'footer');
      const brand = texts(layout, 'brand')[0];
      expect(footerLines.length).toBeGreaterThan(1);
      expect(footerLines.every((l) => !l.text.endsWith('…'))).toBe(true);
      expect(footerLines.at(-1)!.y).toBeLessThan(brand.y);
    });
  });

  describe('three and four teams', () => {
    const GAP = 20;
    const grid = (count: number, size: number, extra: Partial<StoryInput> = {}) => {
      const layout = layoutStory(input(teams(count, size), extra), measure);
      return {
        layout,
        ps: panels(layout),
        plate: rects(layout, 'plate')[0],
        brand: texts(layout, 'brand')[0],
      };
    };
    const overlap = (a: RectCommand, b: RectCommand) =>
      a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

    it.each([[2], [3], [4]])('has one panel for each of the %i teams, in order', (count) => {
      const { ps } = grid(count, 6);
      expect(ps.map((p) => p.team)).toEqual(Array.from({ length: count }, (_, i) => i));
    });

    it.each([[3], [4]])('does not put a panel on top of another with %i teams', (count) => {
      const { ps } = grid(count, 8);
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          expect(overlap(ps[i], ps[j]), `${i} over ${j}`).toBe(false);
        }
      }
    });

    it('puts four teams in a grid of two by two, with the gap between rows and between columns', () => {
      const { ps } = grid(4, 6);
      expect(ps[0].y).toBe(ps[1].y);
      expect(ps[2].y).toBe(ps[3].y);
      expect(ps[2].y - (ps[0].y + ps[0].height)).toBe(GAP);
      expect(ps[2].x).toBe(ps[0].x);
      expect(ps[3].x).toBe(ps[1].x);
      expect(ps[1].x - (ps[0].x + ps[0].width)).toBe(GAP);
      expect(new Set(ps.map((p) => p.width)).size).toBe(1);
      expect(new Set(ps.map((p) => p.height)).size).toBe(1);
    });

    it('puts three teams in two rows, with the third one centered under the other two', () => {
      const { ps } = grid(3, 6);
      expect(ps[0].y).toBe(ps[1].y);
      expect(ps[2].y - (ps[0].y + ps[0].height)).toBe(GAP);
      expect(ps[2].width).toBe(ps[0].width);
      expect(ps[2].x + ps[2].width / 2).toBeCloseTo(STORY_WIDTH / 2, 5);
    });

    it('keeps two teams in one row, side by side, as before', () => {
      const { ps } = grid(2, 7);
      expect(ps[0].y).toBe(ps[1].y);
      expect(ps[1].x).toBeGreaterThan(ps[0].x);
    });

    it.each([[3], [4]])(
      'keeps the title, the count and every player of each team in its panel (%i teams)',
      (count) => {
        const { layout, ps } = grid(count, 6);
        ps.forEach((panel, i) => {
          const mine = layout.commands.filter(
            (c): c is TextCommand => c.kind === 'text' && c.team === i,
          );
          const written = mine.map((t) => t.text);
          for (const player of teams(count, 6)[i].players) expect(written).toContain(player.name);
          for (const text of mine) {
            expect(text.x).toBeGreaterThanOrEqual(panel.x);
            expect(text.x).toBeLessThanOrEqual(panel.x + panel.width);
            expect(text.y).toBeGreaterThan(panel.y);
            expect(text.y).toBeLessThan(panel.y + panel.height);
          }
        });
      },
    );

    it('keeps the plate and the brand inside the story, with 11 players in each of 4 teams', () => {
      const { plate, ps, brand } = grid(4, 11, {
        location: Array.from({ length: 30 }, () => 'calle').join(' '),
      });
      expect(plate.y).toBeGreaterThanOrEqual(0);
      expect(plate.y + plate.height).toBeLessThanOrEqual(STORY_HEIGHT);
      const bottom = Math.max(...ps.map((p) => p.y + p.height));
      expect(bottom).toBeLessThan(plate.y + plate.height);
      expect(brand.y).toBeGreaterThan(bottom);
      expect(brand.y).toBeLessThan(plate.y + plate.height);
    });

    it('keeps the plate inside the story with 3 teams of 11 and a location in two lines', () => {
      const { plate, ps } = grid(3, 11, {
        location: Array.from({ length: 30 }, () => 'calle').join(' '),
      });
      expect(plate.y).toBeGreaterThanOrEqual(0);
      expect(plate.y + plate.height).toBeLessThanOrEqual(STORY_HEIGHT);
      expect(ps.every((p) => p.y + p.height <= plate.y + plate.height)).toBe(true);
    });

    it('makes the rows of players shorter as there are more players, never under 48 px', () => {
      const heightOf = (count: number, size: number) =>
        rects(layoutStory(input(teams(count, size)), measure), 'player-row')[0]?.height;
      expect(heightOf(4, 5)).toBe(72);
      expect(heightOf(4, 11)).toBeLessThan(72);
      expect(heightOf(4, 11)).toBeGreaterThanOrEqual(48);
    });
  });

  describe('footer and brand', () => {
    it('renders brand footer at the bottom', () => {
      const layout = layoutStory(
        input(teams(2, 7), { brand: 'Generado con Kora Roster' }),
        measure,
      );
      const brand = texts(layout, 'brand')[0];
      expect(brand.text).toBe('GENERADO CON KORA ROSTER');
      const [plate] = rects(layout, 'plate');
      const lastRowBottom = Math.max(...rects(layout, 'player-row').map((r) => r.y + r.height));
      expect(brand.y).toBeGreaterThan(lastRowBottom);
      expect(brand.y).toBeLessThan(plate.y + plate.height);
    });
  });
});
