import { Numbering, numberLabel } from './format-teams';

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

const GAP = 20;
const RADIUS = 28;
const PLATE_MARGIN = 36;
const ELLIPSIS = '…';

export type FontWeight = 'normal' | 'bold';
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
  // Optional message header shown above the location and teams.
  header?: string;
  // Where the pitch is. It gets a card of its own under the top row, wrapping without ellipsis.
  location: string;
  footer: string;
  numbering: Numbering;
  confirmed: string;
  brand: string;
  theme?: 'light' | 'dark';
}

export type RectRole =
  | 'plate'
  | 'brand-pill'
  | 'status-pill'
  | 'panel'
  | 'title-bar'
  | 'highlight'
  | 'matchday-card'
  | 'header-card'
  | 'location-card'
  | 'player-row'
  | 'badge';

export type TextRole =
  | 'brand-pill'
  | 'status-pill'
  | 'header'
  | 'location'
  | 'footer'
  | 'brand'
  | 'wordmark'
  | 'title'
  | 'player'
  | 'matchday'
  | 'badge';

export interface RectCommand {
  kind: 'rect';
  role: RectRole;
  team?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  fill: string;
  stroke?: { color: string; width: number };
}

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
  align: 'left' | 'center' | 'right';
}

// The mark of Kora. The picture itself is not part of the layout: whoever draws it brings it.
export interface ImageCommand {
  kind: 'image';
  role: 'logo';
  x: number;
  y: number;
  width: number;
  height: number;
}

export type StoryCommand = RectCommand | TextCommand | ImageCommand;

export interface StoryLayout {
  width: number;
  height: number;
  background: string;
  commands: StoryCommand[];
}

interface ThemeTokens {
  bg: string;
  plate: { fill: string; stroke: string };
  brandPill: { fill: string; stroke: string; text: string };
  wordmark: string;
  statusPill: { fill: string; text: string };
  infoCard: { fill: string; stroke: string; text: string; icon: string };
  matchdayCard: { fill: string; stroke: string; label: string; text: string };
  vsBadge: { fill: string; border: string; text: string; subtext: string };
  teamPanel: { fill: string; stroke: string; title: string; count: string };
  playerRow: { fill: string; stroke: string; num: string; text: string };
  gkRow: { fill: string; stroke: string };
  gkBadge: { fill: string; text: string };
  footer: string;
}

const DARK_THEME: ThemeTokens = {
  bg: '#0a0d12',
  plate: { fill: '#10141b', stroke: '#1f2633' },
  brandPill: { fill: '#1a1811', stroke: '#f59e0b40', text: '#f59e0b' },
  wordmark: '#f8fafc',
  statusPill: { fill: '#f59e0b', text: '#0a0d12' },
  infoCard: { fill: '#161b24', stroke: '#242c3b', text: '#e2e8f0', icon: '#f59e0b' },
  matchdayCard: { fill: '#161b24', stroke: '#242c3b', label: '#94a3b8', text: '#ffffff' },
  vsBadge: { fill: '#0a0d12', border: '#f59e0b60', text: '#f59e0b', subtext: '#94a3b8' },
  teamPanel: { fill: '#13171f', stroke: '#222938', title: '#f8fafc', count: '#94a3b8' },
  playerRow: { fill: '#1a202c', stroke: '#252d3d', num: '#64748b', text: '#f8fafc' },
  gkRow: { fill: '#242116', stroke: '#f59e0b50' },
  gkBadge: { fill: '#f59e0b', text: '#0a0d12' },
  footer: '#64748b',
};

const LIGHT_THEME: ThemeTokens = {
  bg: '#eef2f7',
  plate: { fill: '#ffffff', stroke: '#e2e8f0' },
  brandPill: { fill: '#fff8e6', stroke: '#fde68a', text: '#b45309' },
  wordmark: '#0f172a',
  statusPill: { fill: '#f59e0b', text: '#ffffff' },
  infoCard: { fill: '#f8fafc', stroke: '#e2e8f0', text: '#1e293b', icon: '#b45309' },
  matchdayCard: { fill: '#f8fafc', stroke: '#e2e8f0', label: '#64748b', text: '#0f172a' },
  vsBadge: { fill: '#0f172a', border: '#f59e0b60', text: '#f59e0b', subtext: '#94a3b8' },
  teamPanel: { fill: '#ffffff', stroke: '#e2e8f0', title: '#0f172a', count: '#64748b' },
  playerRow: { fill: '#f8fafc', stroke: '#f1f5f9', num: '#94a3b8', text: '#0f172a' },
  gkRow: { fill: '#fffbeb', stroke: '#fde68a' },
  gkBadge: { fill: '#f59e0b', text: '#ffffff' },
  footer: '#64748b',
};

const PLATE_PADDING = 36;

// The logo of the first row: the mark, the name and the Roster tag, all centered on the line
// of the row. The tag is a little shorter than the row so it reads as a tag of the name.
const WORDMARK = 'KORA';
const WORDMARK_SIZE = 34;
const TAG_LABEL = 'ROSTER';
const TAG_SIZE = 18;
const TAG_PAD_X = 18;
const TAG_HEIGHT = 34;
const LOGO_GAP = 14;

// Header, location and footer: wrapped without ellipsis across as many lines as needed.
const HEADER_SIZE = 24;
const HEADER_LINE_HEIGHT = 32;
const HEADER_PAD_Y = 14;
const LOCATION_SIZE = 22;
const LOCATION_LINE_HEIGHT = 30;
const LOCATION_PAD_Y = 13;
const FOOTER_SIZE = 22;
const FOOTER_LINE_HEIGHT = 30;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// The rows of players: no shorter than MIN_SLOT and no taller than MAX_SLOT.
const MIN_SLOT = 48;
const MAX_SLOT = 72;
// The most the content of the plate can take: the story, the margins and the padding of the plate.
const MAX_CONTENT_H = STORY_HEIGHT - 2 * PLATE_MARGIN - 48;

const gapOf = (slot: number) => clamp(Math.floor(slot * 0.16), 8, 12);

// The tallest slot so that `count` of them, with their gaps, fit in `area` (never under MIN_SLOT).
function fitSlot(area: number, count: number): number {
  for (let slot = MAX_SLOT; slot > MIN_SLOT; slot--) {
    if (count * slot + (count - 1) * gapOf(slot) <= area) return slot;
  }
  return MIN_SLOT;
}

function truncate(
  text: string,
  maxWidth: number,
  size: number,
  weight: FontWeight,
  measure: Measure,
) {
  if (maxWidth <= 0) return ELLIPSIS;
  if (measure(text, size, weight) <= maxWidth) return text;
  const letters = Array.from(text);
  for (let kept = letters.length - 1; kept > 0; kept--) {
    const candidate = `${letters.slice(0, kept).join('').trimEnd()}${ELLIPSIS}`;
    if (measure(candidate, size, weight) <= maxWidth) return candidate;
  }
  return ELLIPSIS;
}

const tidy = (text: string) => text.replace(/\s+/g, ' ').trim();

// Breaks the text into as many lines as needed to fit in `maxWidth` without ellipsis.
// A single word wider than `maxWidth` is split across lines by character.
function wrapLines(
  text: string,
  maxWidth: number,
  size: number,
  weight: FontWeight,
  measure: Measure,
): string[] {
  if (!text) return [];
  const lines: string[] = [];
  let current = '';

  const pushWord = (word: string) => {
    if (measure(word, size, weight) <= maxWidth) {
      current = word;
      return;
    }
    let chunk = '';
    for (const ch of Array.from(word)) {
      const next = chunk + ch;
      if (chunk && measure(next, size, weight) > maxWidth) {
        lines.push(chunk);
        chunk = ch;
      } else {
        chunk = next;
      }
    }
    current = chunk;
  };

  for (const word of text.split(' ')) {
    if (!current) {
      pushWord(word);
      continue;
    }
    const candidate = `${current} ${word}`;
    if (measure(candidate, size, weight) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      pushWord(word);
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function layoutStory(input: StoryInput, measure: Measure): StoryLayout {
  const commands: StoryCommand[] = [];
  const theme = input.theme === 'dark' ? DARK_THEME : LIGHT_THEME;

  const plateWidth = STORY_WIDTH - 2 * PLATE_MARGIN;
  const left = PLATE_MARGIN + PLATE_PADDING;
  const innerWidth = plateWidth - 2 * PLATE_PADDING;

  const teamCount = input.teams.length;
  if (teamCount === 0) {
    const emptyPlateH = 300;
    commands.push({
      kind: 'rect',
      role: 'plate',
      x: PLATE_MARGIN,
      y: (STORY_HEIGHT - emptyPlateH) / 2,
      width: plateWidth,
      height: emptyPlateH,
      radius: 48,
      fill: theme.plate.fill,
      stroke: { color: theme.plate.stroke, width: 2 },
    });
    return { width: STORY_WIDTH, height: STORY_HEIGHT, background: theme.bg, commands };
  }

  const columns = teamCount === 1 ? 1 : 2;
  const rows = Math.ceil(teamCount / columns);
  const colWidth = (innerWidth - GAP * (columns - 1)) / columns;

  const maxPlayers = Math.max(1, ...input.teams.map((t) => t.players.length));

  const headerH = 56;
  const panelPadY = 16;
  const pillHeight = 56;
  const headerText = tidy(input.header ?? '');
  const headerLines = headerText
    ? wrapLines(headerText, innerWidth - 40, HEADER_SIZE, 'bold', measure)
    : [];
  const headerCardHeight =
    headerLines.length > 0 ? 2 * HEADER_PAD_Y + headerLines.length * HEADER_LINE_HEIGHT : 0;

  const locationText = tidy(input.location);
  const locationLines = locationText
    ? wrapLines(locationText, innerWidth - 40, LOCATION_SIZE, 'normal', measure)
    : [];
  const locationHeight =
    locationLines.length > 0
      ? 2 * LOCATION_PAD_Y + locationLines.length * LOCATION_LINE_HEIGHT
      : 0;

  const footerText = tidy(input.footer);
  const footerLines = footerText
    ? wrapLines(footerText, innerWidth - 40, FOOTER_SIZE, 'normal', measure)
    : [];
  const footerHeight = footerLines.length > 0 ? footerLines.length * FOOTER_LINE_HEIGHT : 0;

  const isTwoTeams = teamCount === 2;
  const matchdayHeight = isTwoTeams ? 116 : 0;
  const brandHeight = 36;

  const aboveHeight =
    pillHeight +
    GAP +
    (headerCardHeight > 0 ? headerCardHeight + GAP : 0) +
    (locationHeight > 0 ? locationHeight + GAP : 0) +
    (matchdayHeight > 0 ? matchdayHeight + GAP : 0);
  const belowHeight = (footerHeight > 0 ? footerHeight + GAP : 0) + brandHeight;

  // Dynamic slot height according to player count so rows are comfortable
  // 5-8 players: 68-72px; 9-11 players: 58-64px; 12+ players: 48-54px.
  // When the content exceeds MAX_CONTENT_H, shrink slots so everything fits inside the plate.
  let slotH = clamp(Math.floor(620 / maxPlayers), MIN_SLOT, MAX_SLOT);
  const panelsBudget = MAX_CONTENT_H - aboveHeight - GAP - belowHeight;
  const panelBudget = (panelsBudget - GAP * (rows - 1)) / rows;
  const playersBudget = panelBudget - headerH - 2 * panelPadY;
  const fittedSlot = fitSlot(playersBudget, maxPlayers);
  if (rows > 1 || fittedSlot < slotH) {
    slotH = fittedSlot;
  }
  const rowGap = gapOf(slotH);
  const playersAreaH = maxPlayers * slotH + (maxPlayers - 1) * rowGap;
  const panelHeight = headerH + panelPadY + playersAreaH + panelPadY;
  const panelsHeight = rows * panelHeight + (rows - 1) * GAP;

  const totalContentH = aboveHeight + panelsHeight + GAP + belowHeight;

  // Center vertical layout inside the 1920 story canvas
  const startY = Math.max(PLATE_MARGIN + 24, Math.floor((STORY_HEIGHT - totalContentH) / 2));
  const plateY = Math.max(PLATE_MARGIN, startY - 24);
  const plateHeight = totalContentH + 48;

  // Plate container
  commands.push({
    kind: 'rect',
    role: 'plate',
    x: PLATE_MARGIN,
    y: plateY,
    width: plateWidth,
    height: plateHeight,
    radius: 48,
    fill: theme.plate.fill,
    stroke: { color: theme.plate.stroke, width: 2 },
  });

  // 1. Top row: the logo and brand tag at the left
  const rowCenter = startY + pillHeight / 2;

  commands.push({
    kind: 'image',
    role: 'logo',
    x: left,
    y: startY,
    width: pillHeight,
    height: pillHeight,
  });

  const wordmarkX = left + pillHeight + LOGO_GAP;
  commands.push({
    kind: 'text',
    role: 'wordmark',
    x: wordmarkX,
    y: rowCenter,
    text: WORDMARK,
    size: WORDMARK_SIZE,
    weight: 'bold',
    color: theme.wordmark,
    align: 'left',
  });

  const tagX = wordmarkX + measure(WORDMARK, WORDMARK_SIZE, 'bold') + LOGO_GAP;
  const tagWidth = measure(TAG_LABEL, TAG_SIZE, 'bold') + 2 * TAG_PAD_X;
  commands.push({
    kind: 'rect',
    role: 'brand-pill',
    x: tagX,
    y: rowCenter - TAG_HEIGHT / 2,
    width: tagWidth,
    height: TAG_HEIGHT,
    radius: TAG_HEIGHT / 2,
    fill: theme.brandPill.fill,
    stroke: { color: theme.brandPill.stroke, width: 2 },
  });
  commands.push({
    kind: 'text',
    role: 'brand-pill',
    x: tagX + tagWidth / 2,
    y: rowCenter,
    text: TAG_LABEL,
    size: TAG_SIZE,
    weight: 'bold',
    color: theme.brandPill.text,
    align: 'center',
  });

  let currentY = startY + pillHeight + GAP;

  // 2. Message header card (if provided), under the top row
  if (headerCardHeight > 0) {
    commands.push({
      kind: 'rect',
      role: 'header-card',
      x: left,
      y: currentY,
      width: innerWidth,
      height: headerCardHeight,
      radius: 18,
      fill: theme.infoCard.fill,
      stroke: { color: theme.infoCard.stroke, width: 1.5 },
    });
    headerLines.forEach((line, i) => {
      commands.push({
        kind: 'text',
        role: 'header',
        x: left + 20,
        y: currentY + HEADER_PAD_Y + HEADER_LINE_HEIGHT / 2 + i * HEADER_LINE_HEIGHT,
        text: line,
        size: HEADER_SIZE,
        weight: 'bold',
        color: theme.infoCard.text,
        align: 'left',
      });
    });
    currentY += headerCardHeight + GAP;
  }

  // 3. Location card (if a location is provided), under the header/top row
  if (locationHeight > 0) {
    commands.push({
      kind: 'rect',
      role: 'location-card',
      x: left,
      y: currentY,
      width: innerWidth,
      height: locationHeight,
      radius: 18,
      fill: theme.infoCard.fill,
      stroke: { color: theme.infoCard.stroke, width: 1.5 },
    });
    locationLines.forEach((line, i) => {
      commands.push({
        kind: 'text',
        role: 'location',
        x: left + 20,
        y: currentY + LOCATION_PAD_Y + LOCATION_LINE_HEIGHT / 2 + i * LOCATION_LINE_HEIGHT,
        text: line,
        size: LOCATION_SIZE,
        weight: 'normal',
        color: theme.infoCard.text,
        align: 'left',
      });
    });
    currentY += locationHeight + GAP;
  }

  // 3. Matchday / VS Card (when exactly 2 teams)
  if (isTwoTeams) {
    commands.push({
      kind: 'rect',
      role: 'matchday-card',
      x: left,
      y: currentY,
      width: innerWidth,
      height: matchdayHeight,
      radius: 24,
      fill: theme.matchdayCard.fill,
      stroke: { color: theme.matchdayCard.stroke, width: 1.5 },
    });

    const midX = left + innerWidth / 2;
    const midY = currentY + matchdayHeight / 2;

    // Team A (Left)
    const teamA = input.teams[0];
    const dotRadius = 8;
    commands.push({
      kind: 'rect',
      role: 'matchday-card',
      x: left + 24,
      y: midY - 26,
      width: dotRadius * 2,
      height: dotRadius * 2,
      radius: dotRadius,
      fill: teamA.color,
    });
    commands.push({
      kind: 'text',
      role: 'matchday',
      x: left + 24 + dotRadius * 2 + 10,
      y: midY - 26 + dotRadius,
      text: 'LADO A',
      size: 16,
      weight: 'bold',
      color: theme.matchdayCard.label,
      align: 'left',
    });
    const titleA = truncate(teamA.title.toUpperCase(), midX - left - 120, 32, 'bold', measure);
    commands.push({
      kind: 'text',
      role: 'matchday',
      x: left + 24,
      y: midY + 18,
      text: titleA,
      size: 32,
      weight: 'bold',
      color: teamA.color,
      align: 'left',
    });

    // Center VS circle
    const vsCircleRadius = 38;
    commands.push({
      kind: 'rect',
      role: 'matchday-card',
      x: midX - vsCircleRadius,
      y: midY - vsCircleRadius - 6,
      width: vsCircleRadius * 2,
      height: vsCircleRadius * 2,
      radius: vsCircleRadius,
      fill: theme.vsBadge.fill,
      stroke: { color: theme.vsBadge.border, width: 2 },
    });
    commands.push({
      kind: 'text',
      role: 'matchday',
      x: midX,
      y: midY - 6,
      text: 'VS',
      size: 26,
      weight: 'bold',
      color: theme.vsBadge.text,
      align: 'center',
    });
    commands.push({
      kind: 'text',
      role: 'matchday',
      x: midX,
      y: midY + vsCircleRadius + 4,
      text: 'MATCHDAY',
      size: 13,
      weight: 'bold',
      color: theme.vsBadge.subtext,
      align: 'center',
    });

    // Team B (Right)
    const teamB = input.teams[1];
    commands.push({
      kind: 'rect',
      role: 'matchday-card',
      x: left + innerWidth - 24 - dotRadius * 2,
      y: midY - 26,
      width: dotRadius * 2,
      height: dotRadius * 2,
      radius: dotRadius,
      fill: teamB.color,
    });
    commands.push({
      kind: 'text',
      role: 'matchday',
      x: left + innerWidth - 24 - dotRadius * 2 - 10,
      y: midY - 26 + dotRadius,
      text: 'LADO B',
      size: 16,
      weight: 'bold',
      color: theme.matchdayCard.label,
      align: 'right',
    });
    const titleB = truncate(teamB.title.toUpperCase(), midX - left - 120, 32, 'bold', measure);
    commands.push({
      kind: 'text',
      role: 'matchday',
      x: left + innerWidth - 24,
      y: midY + 18,
      text: titleB,
      size: 32,
      weight: 'bold',
      color: theme.matchdayCard.text,
      align: 'right',
    });

    currentY += matchdayHeight + GAP;
  }

  // 4. Team Columns & Player Lists
  const panelsTop = currentY;
  input.teams.forEach((team, teamIdx) => {
    const rowIdx = Math.floor(teamIdx / columns);
    const colIdx = teamIdx % columns;
    // A last row with fewer panels than columns is centered under the others.
    const inRow = Math.min(columns, teamCount - rowIdx * columns);
    const rowOffset = ((columns - inRow) * (colWidth + GAP)) / 2;
    const panelX = left + rowOffset + colIdx * (colWidth + GAP);
    const panelY = panelsTop + rowIdx * (panelHeight + GAP);

    // Panel container with tight height fitted to players
    commands.push({
      kind: 'rect',
      role: 'panel',
      team: teamIdx,
      x: panelX,
      y: panelY,
      width: colWidth,
      height: panelHeight,
      radius: RADIUS,
      fill: theme.teamPanel.fill,
      // Subtle border: team color at ~44% opacity, thinner stroke
      stroke: { color: (team.color || theme.teamPanel.stroke) + '70', width: 1.5 },
    });

    // Header background tint — drawn after panel rect so it sits inside the border
    // Uses team color at ~18% opacity for a premium, subtle look
    commands.push({
      kind: 'rect',
      role: 'title-bar',
      team: teamIdx,
      x: panelX + 1.5,
      y: panelY + 1.5,
      width: colWidth - 3,
      height: headerH - 1.5,
      radius: RADIUS - 1,
      fill: (team.color || theme.teamPanel.stroke) + '2E',
    });
    // Square off the bottom corners of the header tint (canvas rounded-rect bleeds into body)
    commands.push({
      kind: 'rect',
      role: 'title-bar',
      team: teamIdx,
      x: panelX + 1.5,
      y: panelY + headerH / 2,
      width: colWidth - 3,
      height: headerH / 2,
      radius: 0,
      fill: (team.color || theme.teamPanel.stroke) + '2E',
    });

    // Panel Header (e.g. "TEAM ORO" ... "7 JUG.")
    const headerPadX = 18;
    const titleUpper = team.title.toUpperCase();
    const teamTitleText = titleUpper.startsWith('TEAM') ? titleUpper : `TEAM ${titleUpper}`;
    const countText = `${team.players.length} JUG.`;

    commands.push({
      kind: 'text',
      role: 'title',
      team: teamIdx,
      x: panelX + headerPadX,
      y: panelY + headerH / 2,
      text: teamTitleText,
      size: 22,
      weight: 'bold',
      // Keep team color for title text — readable on the subtle tint background
      color: team.color,
      align: 'left',
    });

    commands.push({
      kind: 'text',
      role: 'title',
      team: teamIdx,
      x: panelX + colWidth - headerPadX,
      y: panelY + headerH / 2,
      text: countText,
      size: 18,
      weight: 'bold',
      color: theme.teamPanel.count,
      align: 'right',
    });

    // Player Rows
    const playersAreaTop = panelY + headerH + 8;
    const playerRowPadX = 14;
    const rowW = colWidth - 2 * playerRowPadX;

    team.players.forEach((player, pIdx) => {
      const pY = playersAreaTop + pIdx * (slotH + rowGap);
      const isGk = player.isGoalkeeper;
      const rowX = panelX + playerRowPadX;

      // Row background
      commands.push({
        kind: 'rect',
        role: isGk ? 'highlight' : 'player-row',
        team: teamIdx,
        x: rowX,
        y: pY,
        width: rowW,
        height: slotH,
        radius: 12,
        fill: isGk ? theme.gkRow.fill : theme.playerRow.fill,
        stroke: { color: isGk ? theme.gkRow.stroke : theme.playerRow.stroke, width: 1.5 },
      });

      // Number label (e.g. "1.", "2.")
      const numStr = numberLabel(pIdx + 1, input.numbering);
      commands.push({
        kind: 'text',
        role: 'player',
        team: teamIdx,
        x: rowX + 16,
        y: pY + slotH / 2,
        text: numStr,
        size: 18,
        weight: 'bold',
        color: isGk ? theme.gkBadge.fill : theme.playerRow.num,
        align: 'left',
      });

      // GK Badge (right side)
      let reservedRight = 16;
      if (isGk) {
        const badgeW = 50;
        const badgeH = 28;
        const badgeX = rowX + rowW - badgeW - 12;
        const badgeY = pY + (slotH - badgeH) / 2;

        commands.push({
          kind: 'rect',
          role: 'badge',
          team: teamIdx,
          x: badgeX,
          y: badgeY,
          width: badgeW,
          height: badgeH,
          radius: 8,
          fill: theme.gkBadge.fill,
        });

        commands.push({
          kind: 'text',
          role: 'badge',
          team: teamIdx,
          x: badgeX + badgeW / 2,
          y: badgeY + badgeH / 2,
          text: 'GK',
          size: 14,
          weight: 'bold',
          color: theme.gkBadge.text,
          align: 'center',
        });

        reservedRight = badgeW + 24;
      }

      // Player Name (strictly calculated relative to the row width, independent of panelX)
      const nameStartX = rowX + 48;
      const maxNameWidth = rowW - 48 - reservedRight;
      const playerName = truncate(player.name, maxNameWidth, 20, isGk ? 'bold' : 'normal', measure);

      commands.push({
        kind: 'text',
        role: 'player',
        team: teamIdx,
        x: nameStartX,
        y: pY + slotH / 2,
        text: playerName,
        size: 20,
        weight: isGk ? 'bold' : 'normal',
        color: theme.playerRow.text,
        align: 'left',
      });
    });
  });

  currentY += panelsHeight + GAP;

  // 5. Footer message (if provided), above the brand line
  if (footerHeight > 0) {
    footerLines.forEach((line, i) => {
      commands.push({
        kind: 'text',
        role: 'footer',
        x: STORY_WIDTH / 2,
        y: currentY + FOOTER_LINE_HEIGHT / 2 + i * FOOTER_LINE_HEIGHT,
        text: line,
        size: FOOTER_SIZE,
        weight: 'normal',
        color: theme.infoCard.text,
        align: 'center',
      });
    });
    currentY += footerHeight + GAP;
  }

  // 6. Brand at the bottom of the plate
  const brandText = tidy(input.brand || 'GENERADO CON KORA ROSTER').toUpperCase();
  commands.push({
    kind: 'text',
    role: 'brand',
    x: STORY_WIDTH / 2,
    y: currentY + brandHeight / 2,
    text: brandText,
    size: 22,
    weight: 'bold',
    color: theme.footer,
    align: 'center',
  });

  return { width: STORY_WIDTH, height: STORY_HEIGHT, background: theme.bg, commands };
}
