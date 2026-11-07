import { readableTextColor } from './contrast';
import { GLOVE, Numbering, numberLabel } from './format-teams';

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

const MARGIN = 48;
const GAP = 24;
const RADIUS = 36;
const PADDING = 32;
const LINE_HEIGHT = 1.25;
const ELLIPSIS = '…';

const BACKGROUND = '#1b2a41';
const ON_BACKGROUND = '#ffffff';
const BRAND = 'Kora Roster';
const BRAND_SIZE = 30;
const BRAND_COLOR = 'rgba(255, 255, 255, 0.6)';

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
}

export interface RectCommand {
  kind: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  fill: string;
}

// y is the middle of the line, and x depends on the alignment.
export interface TextCommand {
  kind: 'text';
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

// Works out where everything goes on a 1080 by 1920 story. It only decides positions,
// sizes and colors, so it can be tested without a browser; drawing is somebody else's job.
// The header, the footer and the brand come first, then each team block with its texts.
export function layoutStory(input: StoryInput, measure: Measure): StoryLayout {
  const commands: StoryCommand[] = [];
  const innerWidth = STORY_WIDTH - 2 * MARGIN;
  const centered = (text: string, y: number, size: number, weight: FontWeight, color: string) =>
    commands.push({
      kind: 'text',
      x: STORY_WIDTH / 2,
      y,
      text,
      size,
      weight,
      color,
      align: 'center',
    });

  const brandZoneTop = STORY_HEIGHT - MARGIN - BRAND_SIZE * 1.5;
  centered(BRAND, STORY_HEIGHT - MARGIN - BRAND_SIZE / 2, BRAND_SIZE, 'normal', BRAND_COLOR);

  let areaTop = MARGIN;
  const header = tidy(input.header);
  if (header) {
    const { size, lines } = fit(header, innerWidth, HEADER, 'bold', measure);
    const lineHeight = size * LINE_HEIGHT;
    lines.forEach((line, i) =>
      centered(line, MARGIN + (i + 0.5) * lineHeight, size, 'bold', ON_BACKGROUND),
    );
    areaTop = MARGIN + lines.length * lineHeight + GAP;
  }

  let areaBottom = brandZoneTop - GAP;
  const footer = tidy(input.footer);
  if (footer) {
    const { size, lines } = fit(footer, innerWidth, FOOTER, 'bold', measure);
    const lineHeight = size * LINE_HEIGHT;
    const top = brandZoneTop - 8 - lines.length * lineHeight;
    lines.forEach((line, i) =>
      centered(line, top + (i + 0.5) * lineHeight, size, 'bold', ON_BACKGROUND),
    );
    areaBottom = top - GAP;
  }

  const count = input.teams.length;
  if (count === 0)
    return { width: STORY_WIDTH, height: STORY_HEIGHT, background: BACKGROUND, commands };

  const longest = Math.max(1, ...input.teams.map((team) => team.players.length));
  const arrange = (columns: number) => {
    const rows = Math.ceil(count / columns);
    const cellWidth = (innerWidth - GAP * (columns - 1)) / columns;
    const cellHeight = (areaBottom - areaTop - GAP * (rows - 1)) / rows;
    const titleSize = clamp(Math.round(cellHeight * 0.1), TITLE.min + 4, TITLE.max);
    const titleRow = titleSize * 1.4;
    const rowHeight = (cellHeight - 2 * PADDING - titleRow) / longest;
    // The same size for every name on the page, from the team with most players.
    const nameSize = clamp(Math.floor(rowHeight / LINE_HEIGHT), NAME.min, NAME.max);
    return { columns, cellWidth, cellHeight, titleSize, titleRow, rowHeight, nameSize };
  };

  // Up to 3 teams are stacked; from 4 on, in two columns. Three teams with so many players
  // that stacking them makes the names small also go in two columns, if that makes them
  // bigger. A last row that is not full is centered.
  let grid = arrange(count >= 4 ? 2 : 1);
  if (count === 3 && grid.nameSize < READABLE_NAME) {
    const twoColumns = arrange(2);
    if (twoColumns.nameSize > grid.nameSize) grid = twoColumns;
  }
  const { columns, cellWidth, cellHeight, titleSize, titleRow, rowHeight, nameSize } = grid;
  const textWidth = cellWidth - 2 * PADDING;

  input.teams.forEach((team, index) => {
    const row = Math.floor(index / columns);
    const inRow = Math.min(columns, count - row * columns);
    const x =
      MARGIN + (index % columns) * (cellWidth + GAP) + ((columns - inRow) * (cellWidth + GAP)) / 2;
    const y = areaTop + row * (cellHeight + GAP);
    const color = readableTextColor(team.color);

    commands.push({
      kind: 'rect',
      x,
      y,
      width: cellWidth,
      height: cellHeight,
      radius: RADIUS,
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
      x: x + PADDING,
      y: y + PADDING + titleRow / 2,
      text: title.lines[0],
      size: title.size,
      weight: 'bold',
      color,
      align: 'left',
    });

    team.players.forEach((player, i) => {
      const prefix = numberLabel(i + 1, input.numbering);
      const suffix = player.isGoalkeeper ? ` ${GLOVE}` : '';
      // Only the name is cut, so the number and the glove of a goalkeeper always stay.
      const around: Measure = (text, size, weight) =>
        measure(`${prefix}${text}${suffix}`, size, weight);
      const name = truncate(player.name, textWidth, nameSize, 'normal', around);
      commands.push({
        kind: 'text',
        x: x + PADDING,
        y: y + PADDING + titleRow + (i + 0.5) * rowHeight,
        text: `${prefix}${name}${suffix}`,
        size: nameSize,
        weight: 'normal',
        color,
        align: 'left',
      });
    });
  });

  return { width: STORY_WIDTH, height: STORY_HEIGHT, background: BACKGROUND, commands };
}
