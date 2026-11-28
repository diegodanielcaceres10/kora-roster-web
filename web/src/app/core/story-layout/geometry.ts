import {
  BRAND_HEIGHT,
  clamp,
  CONTENT_WIDTH,
  FOOTER_STYLE,
  fitSlot,
  GAP,
  gapOf,
  HEADER_STYLE,
  INFO_TEXT_INSET,
  LOCATION_STYLE,
  MATCHDAY_HEIGHT,
  MAX_CONTENT_H,
  MAX_SLOT,
  MIN_SLOT,
  PANEL_HEADER_HEIGHT,
  PANEL_PAD_Y,
  PLATE_MARGIN,
  PLATE_PAD_Y,
  STORY_HEIGHT,
  TextBlockStyle,
  TOP_ROW_HEIGHT,
} from './metrics';
import { wrapText } from './text-fit';
import { Measure, StoryInput } from './types';

// Where everything goes, in numbers. It has no commands: the sections draw from it.
export interface StoryGeometry {
  teamCount: number;
  columns: number;
  colWidth: number;
  headerLines: string[];
  headerCardHeight: number;
  locationLines: string[];
  locationHeight: number;
  footerLines: string[];
  footerHeight: number;
  // Zero unless there are exactly two teams.
  matchdayHeight: number;
  slotH: number;
  rowGap: number;
  panelHeight: number;
  panelsHeight: number;
  startY: number;
  plateY: number;
  plateHeight: number;
}

// Room for the rows of players that looks comfortable before the page asks for less.
const PREFERRED_PLAYERS_AREA = 620;

const cardHeightOf = (lines: number, style: TextBlockStyle) =>
  lines > 0 ? 2 * style.padY + lines * style.lineHeight : 0;

const wrapBlock = (text: string, style: TextBlockStyle, measure: Measure) =>
  wrapText(text, CONTENT_WIDTH - 2 * INFO_TEXT_INSET, style.size, style.weight, measure);

// For a story with at least one team.
export function computeGeometry(input: StoryInput, measure: Measure): StoryGeometry {
  const teamCount = input.teams.length;
  const columns = teamCount === 1 ? 1 : 2;
  const rows = Math.ceil(teamCount / columns);
  const colWidth = (CONTENT_WIDTH - GAP * (columns - 1)) / columns;

  const maxPlayers = Math.max(1, ...input.teams.map((t) => t.players.length));

  const headerLines = wrapBlock(input.header ?? '', HEADER_STYLE, measure);
  const headerCardHeight = cardHeightOf(headerLines.length, HEADER_STYLE);

  const locationLines = wrapBlock(input.location, LOCATION_STYLE, measure);
  const locationHeight = cardHeightOf(locationLines.length, LOCATION_STYLE);

  const footerLines = wrapBlock(input.footer, FOOTER_STYLE, measure);
  const footerHeight = footerLines.length * FOOTER_STYLE.lineHeight;

  const matchdayHeight = teamCount === 2 ? MATCHDAY_HEIGHT : 0;

  const aboveHeight =
    TOP_ROW_HEIGHT +
    GAP +
    (headerCardHeight > 0 ? headerCardHeight + GAP : 0) +
    (locationHeight > 0 ? locationHeight + GAP : 0) +
    (matchdayHeight > 0 ? matchdayHeight + GAP : 0);
  const belowHeight = (footerHeight > 0 ? footerHeight + GAP : 0) + BRAND_HEIGHT;

  // Dynamic slot height according to player count so rows are comfortable
  // 5-8 players: 68-72px; 9-11 players: 58-64px; 12+ players: 48-54px.
  // When the content exceeds MAX_CONTENT_H, shrink slots so everything fits inside the plate.
  let slotH = clamp(Math.floor(PREFERRED_PLAYERS_AREA / maxPlayers), MIN_SLOT, MAX_SLOT);
  const panelsBudget = MAX_CONTENT_H - aboveHeight - GAP - belowHeight;
  const panelBudget = (panelsBudget - GAP * (rows - 1)) / rows;
  const playersBudget = panelBudget - PANEL_HEADER_HEIGHT - 2 * PANEL_PAD_Y;
  const fittedSlot = fitSlot(playersBudget, maxPlayers);
  if (rows > 1 || fittedSlot < slotH) {
    slotH = fittedSlot;
  }
  const rowGap = gapOf(slotH);
  const playersAreaH = maxPlayers * slotH + (maxPlayers - 1) * rowGap;
  const panelHeight = PANEL_HEADER_HEIGHT + PANEL_PAD_Y + playersAreaH + PANEL_PAD_Y;
  const panelsHeight = rows * panelHeight + (rows - 1) * GAP;

  const totalContentH = aboveHeight + panelsHeight + GAP + belowHeight;

  // Center vertical layout inside the 1920 story canvas
  const startY = Math.max(
    PLATE_MARGIN + PLATE_PAD_Y,
    Math.floor((STORY_HEIGHT - totalContentH) / 2),
  );
  const plateY = Math.max(PLATE_MARGIN, startY - PLATE_PAD_Y);
  const plateHeight = totalContentH + 2 * PLATE_PAD_Y;

  return {
    teamCount,
    columns,
    colWidth,
    headerLines,
    headerCardHeight,
    locationLines,
    locationHeight,
    footerLines,
    footerHeight,
    matchdayHeight,
    slotH,
    rowGap,
    panelHeight,
    panelsHeight,
    startY,
    plateY,
    plateHeight,
  };
}
