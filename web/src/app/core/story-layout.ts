import { Numbering, numberLabel } from './format-teams';

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

const GAP = 20;
const RADIUS = 28;
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
  header: string;
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
  | 'player-row'
  | 'badge';

export type TextRole =
  | 'brand-pill'
  | 'status-pill'
  | 'header'
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

const PLATE_MARGIN = 36;
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
  const colWidth = (innerWidth - GAP * (columns - 1)) / columns;

  const maxPlayers = Math.max(1, ...input.teams.map((t) => t.players.length));

  // Dynamic slot height according to player count so rows are comfortable
  // 5-8 players: 68-72px; 9-11 players: 58-64px; 12+ players: 48-54px
  const slotH = clamp(Math.floor(620 / maxPlayers), 48, 72);
  const rowGap = clamp(Math.floor(slotH * 0.16), 8, 12);
  const headerH = 56;
  const panelPadY = 16;
  const playersAreaH = maxPlayers * slotH + (maxPlayers - 1) * rowGap;
  const panelHeight = headerH + panelPadY + playersAreaH + panelPadY;

  // Calculate vertical height of elements
  const pillHeight = 56;
  const headerText = tidy(input.header);
  const infoHeight = headerText ? 56 : 0;
  const isTwoTeams = teamCount === 2;
  const matchdayHeight = isTwoTeams ? 116 : 0;
  const brandHeight = 36;

  const totalContentH =
    pillHeight +
    GAP +
    (infoHeight > 0 ? infoHeight + GAP : 0) +
    (matchdayHeight > 0 ? matchdayHeight + GAP : 0) +
    panelHeight +
    GAP +
    brandHeight;

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

  // 1. Top row: the logo at the left and the status pill at the right
  const pillSize = 24;
  const pillPadX = 24;
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

  const longest = Math.max(0, ...input.teams.map((t) => t.players.length));
  const statusText = [longest > 0 ? `${longest}V${longest}` : '', tidy(input.confirmed).toUpperCase()]
    .filter(Boolean)
    .join(' ');

  if (statusText) {
    const statusWidth = measure(statusText, pillSize, 'bold') + 2 * pillPadX;
    const statusX = left + innerWidth - statusWidth;
    commands.push({
      kind: 'rect',
      role: 'status-pill',
      x: statusX,
      y: startY,
      width: statusWidth,
      height: pillHeight,
      radius: pillHeight / 2,
      fill: theme.statusPill.fill,
    });
    commands.push({
      kind: 'text',
      role: 'status-pill',
      x: statusX + statusWidth / 2,
      y: startY + pillHeight / 2,
      text: statusText,
      size: pillSize,
      weight: 'bold',
      color: theme.statusPill.text,
      align: 'center',
    });
  }

  let currentY = startY + pillHeight + GAP;

  // 2. Info / Header Card (if header is provided)
  if (headerText) {
    commands.push({
      kind: 'rect',
      role: 'header-card',
      x: left,
      y: currentY,
      width: innerWidth,
      height: infoHeight,
      radius: 18,
      fill: theme.infoCard.fill,
      stroke: { color: theme.infoCard.stroke, width: 1.5 },
    });

    const infoFormatted = headerText.toUpperCase();
    const displayInfo = truncate(infoFormatted, innerWidth - 40, 22, 'bold', measure);
    commands.push({
      kind: 'text',
      role: 'header',
      x: left + 20,
      y: currentY + infoHeight / 2,
      text: displayInfo,
      size: 22,
      weight: 'bold',
      color: theme.infoCard.text,
      align: 'left',
    });

    currentY += infoHeight + GAP;
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
  input.teams.forEach((team, teamIdx) => {
    const colIdx = teamIdx % columns;
    const panelX = left + colIdx * (colWidth + GAP);
    const panelY = currentY;

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
      stroke: { color: team.color || theme.teamPanel.stroke, width: 2.5 },
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

  currentY += panelHeight + GAP;

  // 5. Footer & Brand at the bottom of the plate
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
