import { readableTextColor } from './contrast';
import { GLOVE, Numbering, numberLabel } from './format-teams';

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

const GAP = 24;
const RADIUS = 36;
const LINE_HEIGHT = 1.25;
const ELLIPSIS = '…';

// The story is a white plate on a light page. Everything is drawn inside the plate.
const BACKGROUND = '#eef2f7';
const PLATE = { margin: 36, padding: 40, radius: 56, fill: '#ffffff', stroke: '#d9e2ec' };
const INK = '#1b2a41';
const MUTED = '#64748b';
const BRAND = 'KORA ROSTER';
const BRAND_SIZE = 28;
const PILL = { height: 64, size: 26, padX: 28 };
const AMBER = {
  soft: '#fff4d6',
  border: '#f8c24a',
  ink: '#92400e',
  solid: '#f59e0b',
  onSolid: '#1b2a41',
};
// The space between the edge of a team panel and what is in it, and from there to the text.
const INSET = 14;
const TEXT_INSET = INSET + 22;
const BAR_RADIUS = 26;
const ROW_RADIUS = 18;
const KEEPER_TINT = 0.2;

const HEADER = { max: 64, min: 32, lines: 2 };
const FOOTER = { max: 40, min: 26, lines: 2 };
const TITLE = { max: 56, min: 28 };
const NAME = { max: 52, min: 22 };
// Below this size, 3 stacked teams give way to two columns, which leave room for bigger names.
const READABLE_NAME = 36;

export type FontWeight = 'normal' | 'bold';
// Width in pixels of a text, supplied by whoever draws, because only the real font knows it.
export type Measure = (text: string, size: number, weight: FontWeight) => number;

export interface StoryPlayer {
  name: string;
  isGoalkeeper: boolean;
}

export interface StoryTeam {
  title: string;
  color: string;
  players: readonly StoryPlayer[];
}

export interface StoryInput {
  teams: readonly StoryTeam[];
  header: string;
  footer: string;
  numbering: Numbering;
  // What the status pill says after the size of the teams ("confirmed"), and the line at the
  // bottom ("Made with Kora Roster"), already in the language of the person.
  confirmed: string;
  brand: string;
}

// Every command says what it is for, so that tests and other drawers do not depend on the order.
export type RectRole = 'plate' | 'brand-pill' | 'status-pill' | 'panel' | 'title-bar' | 'highlight';
export type TextRole =
  | 'brand-pill'
  | 'status-pill'
  | 'header'
  | 'footer'
  | 'brand'
  | 'title'
  | 'player';

export interface RectCommand {
  kind: 'rect';
  role: RectRole;
  // The index of the team it belongs to, when it belongs to one.
  team?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  fill: string;
  stroke?: { color: string; width: number };
}

// y is the middle of the line, and x depends on the alignment.
export interface TextCommand {
  kind: 'text';
  role: TextRole;
  team?: number;
  x: number;
  y: number;
  text: string;
  size: number;
  weight: FontWeight;
  color: string;
  align: 'left' | 'center';
}

export type StoryCommand = RectCommand | TextCommand;

export interface StoryLayout {
  width: number;
  height: number;
  background: string;
  commands: StoryCommand[];
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function truncate(
  text: string,
  maxWidth: number,
  size: number,
  weight: FontWeight,
  measure: Measure,
) {
  if (measure(text, size, weight) <= maxWidth) return text;
  const letters = Array.from(text);
  for (let kept = letters.length - 1; kept > 0; kept--) {
    const candidate = `${letters.slice(0, kept).join('').trimEnd()}${ELLIPSIS}`;
    if (measure(candidate, size, weight) <= maxWidth) return candidate;
  }
  return ELLIPSIS;
}

function wrap(text: string, maxWidth: number, size: number, weight: FontWeight, measure: Measure) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(candidate, size, weight) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// The biggest size at which the text fits, using as few lines as possible: one line may be
// up to 30% smaller than the biggest size before a second line is used, so a lone word is
// not left on its own. If not even the smallest size fits, the last line ends with an ellipsis.
function fit(
  text: string,
  maxWidth: number,
  limits: { max: number; min: number; lines: number },
  weight: FontWeight,
  measure: Measure,
) {
  for (let count = 1; count <= limits.lines; count++) {
    const floor =
      count === limits.lines ? limits.min : Math.max(limits.min, Math.round(limits.max * 0.7));
    for (let size = limits.max; size >= floor; size -= 2) {
      const lines = wrap(text, maxWidth, size, weight, measure);
      if (lines.length <= count && lines.every((l) => measure(l, size, weight) <= maxWidth)) {
        return { size, lines };
      }
    }
  }
  const size = limits.min;
  const lines = wrap(text, maxWidth, size, weight, measure);
  const kept = lines.slice(0, limits.lines);
  if (lines.length > limits.lines) {
    kept[limits.lines - 1] = lines.slice(limits.lines - 1).join(' ');
  }
  return { size, lines: kept.map((l) => truncate(l, maxWidth, size, weight, measure)) };
}

const tidy = (text: string) => text.replace(/\s+/g, ' ').trim();

// The color of a team, see through, to tint a row without hiding the name on top of it.
function tint(color: string, alpha: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return `rgba(27, 42, 65, ${alpha / 2})`;
  const value = parseInt(match[1], 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

// Works out where everything goes on a 1080 by 1920 story. It only decides positions,
// sizes and colors, so it can be tested without a browser; drawing is somebody else's job.
// From top to bottom: the pills, the header, a panel for each team, the footer and the brand.
export function layoutStory(input: StoryInput, measure: Measure): StoryLayout {
  const commands: StoryCommand[] = [];
  const plateWidth = STORY_WIDTH - 2 * PLATE.margin;
  const plateHeight = STORY_HEIGHT - 2 * PLATE.margin;
  commands.push({
    kind: 'rect',
    role: 'plate',
    x: PLATE.margin,
    y: PLATE.margin,
    width: plateWidth,
    height: plateHeight,
    radius: PLATE.radius,
    fill: PLATE.fill,
    stroke: { color: PLATE.stroke, width: 3 },
  });
  const left = PLATE.margin + PLATE.padding;
  const innerWidth = plateWidth - 2 * PLATE.padding;
  const contentTop = PLATE.margin + PLATE.padding;
  const contentBottom = STORY_HEIGHT - PLATE.margin - PLATE.padding;
  const centered = (
    role: 'header' | 'footer' | 'brand',
    text: string,
    y: number,
    size: number,
    weight: FontWeight,
    color: string,
  ) =>
    commands.push({
      kind: 'text',
      role,
      x: STORY_WIDTH / 2,
      y,
      text,
      size,
      weight,
      color,
      align: 'center',
    });

  // The pills: the brand at the left, and at the right what the teams are.
  const pill = (
    role: 'brand-pill' | 'status-pill',
    text: string,
    place: (width: number) => number,
    fill: string,
    color: string,
    stroke?: string,
  ) => {
    const width = measure(text, PILL.size, 'bold') + 2 * PILL.padX;
    const x = place(width);
    commands.push({
      kind: 'rect',
      role,
      x,
      y: contentTop,
      width,
      height: PILL.height,
      radius: PILL.height / 2,
      fill,
      ...(stroke ? { stroke: { color: stroke, width: 3 } } : {}),
    });
    commands.push({
      kind: 'text',
      role,
      x: x + width / 2,
      y: contentTop + PILL.height / 2,
      text,
      size: PILL.size,
      weight: 'bold',
      color,
      align: 'center',
    });
  };
  pill('brand-pill', BRAND, () => left, AMBER.soft, AMBER.ink, AMBER.border);
  const longest = Math.max(0, ...input.teams.map((team) => team.players.length));
  const status = [longest > 0 ? `${longest}V${longest}` : '', tidy(input.confirmed).toUpperCase()]
    .filter(Boolean)
    .join(' ');
  if (status) pill('status-pill', status, (width) => left + innerWidth - width, AMBER.solid, AMBER.onSolid);

  const brandZoneTop = contentBottom - BRAND_SIZE * 1.5;
  const brand = tidy(input.brand).toUpperCase();
  if (brand) centered('brand', brand, contentBottom - BRAND_SIZE / 2, BRAND_SIZE, 'bold', MUTED);

  let areaTop = contentTop + PILL.height + GAP;
  const header = tidy(input.header);
  if (header) {
    const { size, lines } = fit(header, innerWidth, HEADER, 'bold', measure);
    const lineHeight = size * LINE_HEIGHT;
    lines.forEach((line, i) =>
      centered('header', line, areaTop + (i + 0.5) * lineHeight, size, 'bold', INK),
    );
    areaTop += lines.length * lineHeight + GAP;
  }

  let areaBottom = brandZoneTop - GAP;
  const footer = tidy(input.footer);
  if (footer) {
    const { size, lines } = fit(footer, innerWidth, FOOTER, 'bold', measure);
    const lineHeight = size * LINE_HEIGHT;
    const top = brandZoneTop - 8 - lines.length * lineHeight;
    lines.forEach((line, i) =>
      centered('footer', line, top + (i + 0.5) * lineHeight, size, 'bold', INK),
    );
    areaBottom = top - GAP;
  }

  const count = input.teams.length;
  if (count === 0)
    return { width: STORY_WIDTH, height: STORY_HEIGHT, background: BACKGROUND, commands };

  const rowsOfPlayers = Math.max(1, longest);
  const arrange = (columns: number) => {
    const rows = Math.ceil(count / columns);
    const cellWidth = (innerWidth - GAP * (columns - 1)) / columns;
    const cellHeight = (areaBottom - areaTop - GAP * (rows - 1)) / rows;
    const titleSize = clamp(Math.round(cellHeight * 0.09), TITLE.min + 4, TITLE.max);
    const barHeight = titleSize * 1.4 + 2 * INSET;
    const rowsTop = INSET + barHeight + INSET;
    const rowHeight = (cellHeight - rowsTop - INSET) / rowsOfPlayers;
    // The same size for every name on the page, from the team with most players.
    const nameSize = clamp(Math.floor(rowHeight / LINE_HEIGHT), NAME.min, NAME.max);
    return { columns, cellWidth, cellHeight, titleSize, barHeight, rowsTop, rowHeight, nameSize };
  };

  // Up to 3 teams are stacked; from 4 on, in two columns. Three teams with so many players
  // that stacking them makes the names small also go in two columns, if that makes them
  // bigger. A last row that is not full is centered.
  let grid = arrange(count >= 4 ? 2 : 1);
  if (count === 3 && grid.nameSize < READABLE_NAME) {
    const twoColumns = arrange(2);
    if (twoColumns.nameSize > grid.nameSize) grid = twoColumns;
  }
  const { columns, cellWidth, cellHeight, titleSize, barHeight, rowsTop, rowHeight, nameSize } =
    grid;
  const textWidth = cellWidth - 2 * TEXT_INSET;

  input.teams.forEach((team, index) => {
    const row = Math.floor(index / columns);
    const inRow = Math.min(columns, count - row * columns);
    const x = left + (index % columns) * (cellWidth + GAP) + ((columns - inRow) * (cellWidth + GAP)) / 2;
    const y = areaTop + row * (cellHeight + GAP);

    commands.push({
      kind: 'rect',
      role: 'panel',
      team: index,
      x,
      y,
      width: cellWidth,
      height: cellHeight,
      radius: RADIUS,
      fill: '#ffffff',
      stroke: { color: team.color, width: 5 },
    });
    commands.push({
      kind: 'rect',
      role: 'title-bar',
      team: index,
      x: x + INSET,
      y: y + INSET,
      width: cellWidth - 2 * INSET,
      height: barHeight,
      radius: BAR_RADIUS,
      fill: team.color,
    });

    const title = fit(
      team.title,
      textWidth,
      { ...TITLE, max: titleSize, lines: 1 },
      'bold',
      measure,
    );
    commands.push({
      kind: 'text',
      role: 'title',
      team: index,
      x: x + TEXT_INSET,
      y: y + INSET + barHeight / 2,
      text: title.lines[0],
      size: title.size,
      weight: 'bold',
      color: readableTextColor(team.color),
      align: 'left',
    });

    team.players.forEach((player, i) => {
      const rowTop = y + rowsTop + i * rowHeight;
      if (player.isGoalkeeper) {
        commands.push({
          kind: 'rect',
          role: 'highlight',
          team: index,
          x: x + INSET,
          y: rowTop + 2,
          width: cellWidth - 2 * INSET,
          height: rowHeight - 4,
          radius: ROW_RADIUS,
          fill: tint(team.color, KEEPER_TINT),
        });
      }
      const prefix = numberLabel(i + 1, input.numbering);
      const suffix = player.isGoalkeeper ? ` ${GLOVE}` : '';
      // Only the name is cut, so the number and the glove of a goalkeeper always stay.
      const around: Measure = (text, size, weight) =>
        measure(`${prefix}${text}${suffix}`, size, weight);
      const weight: FontWeight = player.isGoalkeeper ? 'bold' : 'normal';
      const name = truncate(player.name, textWidth, nameSize, weight, around);
      commands.push({
        kind: 'text',
        role: 'player',
        team: index,
        x: x + TEXT_INSET,
        y: rowTop + rowHeight / 2,
        text: `${prefix}${name}${suffix}`,
        size: nameSize,
        weight,
        color: INK,
        align: 'left',
      });
    });
  });

  return { width: STORY_WIDTH, height: STORY_HEIGHT, background: BACKGROUND, commands };
}
