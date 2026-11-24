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
  header: '',
  footer: '',
  numbering: 'dot',
  confirmed: 'confirmed',
  brand: 'GENERADO CON KORA ROSTER',
  ...extra,
});

const rects = (layout: StoryLayout, role: RectCommand['role']) =>
  layout.commands.filter((c): c is RectCommand => c.kind === 'rect' && c.role === role);
const texts = (layout: StoryLayout, role: TextCommand['role']) =>
  layout.commands.filter((c): c is TextCommand => c.kind === 'text' && c.role === role);
const panels = (layout: StoryLayout) => rects(layout, 'panel');
const teamTexts = (layout: StoryLayout, index: number, role: 'title' | 'player') =>
  texts(layout, role).filter((t) => t.team === index);
const names = (layout: StoryLayout) => texts(layout, 'player');

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

    it('has a plate with rounded corners inside the page', () => {
      const [plate, ...others] = rects(layoutStory(input(teams(2, 7)), measure), 'plate');
      expect(others).toHaveLength(0);
      expect([plate.x, plate.y]).toEqual([PLATE_MARGIN, PLATE_MARGIN]);
      expect(plate.width).toBe(STORY_WIDTH - 2 * PLATE_MARGIN);
      expect(plate.height).toBe(STORY_HEIGHT - 2 * PLATE_MARGIN);
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

    it('leaves the pill out when there is nothing to say', () => {
      const layout = layoutStory(input([team(0, 0)], { confirmed: '  ' }), measure);
      expect(rects(layout, 'status-pill')).toHaveLength(0);
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
      expect(firstPlayer.text).toBe('1-');
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

  describe('header and footer', () => {
    it('renders a header card when header text is provided', () => {
      const layout = layoutStory(input(teams(2, 7), { header: 'Martes 20:30 // Cancha 1' }), measure);
      expect(rects(layout, 'header-card')).toHaveLength(1);
      expect(texts(layout, 'header')).toHaveLength(1);
    });

    it('omits header card when header is empty', () => {
      const layout = layoutStory(input(teams(2, 7), { header: '' }), measure);
      expect(rects(layout, 'header-card')).toHaveLength(0);
    });

    it('renders brand footer at the bottom', () => {
      const layout = layoutStory(input(teams(2, 7), { brand: 'Generado con Kora Roster' }), measure);
      const brand = texts(layout, 'brand')[0];
      expect(brand.text).toBe('GENERADO CON KORA ROSTER');
      expect(brand.y).toBeGreaterThan(1700);
    });
  });
});
