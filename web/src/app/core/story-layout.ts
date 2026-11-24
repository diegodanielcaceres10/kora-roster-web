import { GLOVE, Numbering, numberLabel } from './format-teams';

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

const GAP = 20;
const RADIUS = 28;
const LINE_HEIGHT = 1.25;
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

export type StoryCommand = RectCommand | TextCommand;

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
const BRAND_LABEL = 'KORA ROSTER';

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

const tidy = (text: string) => text.replace(/\s+/g, ' ').trim();

export function layoutStory(input: StoryInput, measure: Measure): StoryLayout {
  const commands: StoryCommand[] = [];
  const theme = input.theme === 'dark' ? DARK_THEME : LIGHT_THEME;

  const plateWidth = STORY_WIDTH - 2 * PLATE_MARGIN;
  const plateHeight = STORY_HEIGHT - 2 * PLATE_MARGIN;

  commands.push({
    kind: 'rect',
    role: 'plate',
    x: PLATE_MARGIN,
    y: PLATE_MARGIN,
    width: plateWidth,
    height: plateHeight,
    radius: 48,
    fill: theme.plate.fill,
    stroke: { color: theme.plate.stroke, width: 2 },
  });

  const left = PLATE_MARGIN + PLATE_PADDING;
  const innerWidth = plateWidth - 2 * PLATE_PADDING;
  const top = PLATE_MARGIN + PLATE_PADDING;
  const bottom = STORY_HEIGHT - PLATE_MARGIN - PLATE_PADDING;

  // 1. Top row: Brand pill and Status pill
  const pillHeight = 56;
  const pillSize = 24;
  const pillPadX = 24;

  const brandWidth = measure(BRAND_LABEL, pillSize, 'bold') + 2 * pillPadX;
  commands.push({
    kind: 'rect',
    role: 'brand-pill',
    x: left,
    y: top,
    width: brandWidth,
    height: pillHeight,
    radius: pillHeight / 2,
    fill: theme.brandPill.fill,
    stroke: { color: theme.brandPill.stroke, width: 2 },
  });
  commands.push({
    kind: 'text',
    role: 'brand-pill',
    x: left + brandWidth / 2,
    y: top + pillHeight / 2,
    text: BRAND_LABEL,
    size: pillSize,
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
      y: top,
      width: statusWidth,
      height: pillHeight,
      radius: pillHeight / 2,
      fill: theme.statusPill.fill,
    });
    commands.push({
      kind: 'text',
      role: 'status-pill',
      x: statusX + statusWidth / 2,
      y: top + pillHeight / 2,
      text: statusText,
      size: pillSize,
      weight: 'bold',
      color: theme.statusPill.text,
      align: 'center',
    });
  }

  let currentY = top + pillHeight + GAP;

  // 2. Info / Header Card (if header is provided)
  const headerText = tidy(input.header);
  if (headerText) {
    const infoHeight = 56;
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
  const isTwoTeams = input.teams.length === 2;
  if (isTwoTeams) {
    const matchdayHeight = 116;
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

  // 4. Footer & Brand at the bottom
  const brandHeight = 36;
  const footerY = bottom - brandHeight / 2;
  const brandText = tidy(input.brand || 'GENERADO CON KORA ROSTER').toUpperCase();
  commands.push({
    kind: 'text',
    role: 'brand',
    x: STORY_WIDTH / 2,
    y: footerY,
    text: brandText,
    size: 22,
    weight: 'bold',
    color: theme.footer,
    align: 'center',
  });

  const availableBottom = bottom - brandHeight - GAP;

  // 5. Team Columns & Player Lists
  const teamCount = input.teams.length;
  if (teamCount === 0) {
    return { width: STORY_WIDTH, height: STORY_HEIGHT, background: theme.bg, commands };
  }

  const columns = teamCount === 1 ? 1 : 2;
  const rows = Math.ceil(teamCount / columns);
  const colWidth = (innerWidth - GAP * (columns - 1)) / columns;
  const rowHeight = (availableBottom - currentY - GAP * (rows - 1)) / rows;

  input.teams.forEach((team, teamIdx) => {
    const colIdx = teamIdx % columns;
    const gridRowIdx = Math.floor(teamIdx / columns);
    const panelX = left + colIdx * (colWidth + GAP);
    const panelY = currentY + gridRowIdx * (rowHeight + GAP);

    // Panel container
    commands.push({
      kind: 'rect',
      role: 'panel',
      team: teamIdx,
      x: panelX,
      y: panelY,
      width: colWidth,
      height: rowHeight,
      radius: RADIUS,
      fill: theme.teamPanel.fill,
      stroke: { color: team.color || theme.teamPanel.stroke, width: 2.5 },
    });

    // Panel Header (e.g. "TEAM ORO" ... "7 JUG.")
    const headerH = 56;
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
    const playersAreaH = rowHeight - headerH - 20;
    const maxP = Math.max(1, team.players.length);
    const slotH = clamp(Math.floor((playersAreaH - (maxP - 1) * 8) / maxP), 38, 56);
    const playerRowPadX = 14;

    team.players.forEach((player, pIdx) => {
      const pY = playersAreaTop + pIdx * (slotH + 8);
      const isGk = player.isGoalkeeper;

      // Row background
      commands.push({
        kind: 'rect',
        role: isGk ? 'highlight' : 'player-row',
        team: teamIdx,
        x: panelX + playerRowPadX,
        y: pY,
        width: colWidth - 2 * playerRowPadX,
        height: slotH,
        radius: 12,
        fill: isGk ? theme.gkRow.fill : theme.playerRow.fill,
        stroke: { color: isGk ? theme.gkRow.stroke : theme.playerRow.stroke, width: 1.5 },
      });

      // Number (e.g. "1", "2")
      const numStr = numberLabel(pIdx + 1, input.numbering);
      commands.push({
        kind: 'text',
        role: 'player',
        team: teamIdx,
        x: panelX + playerRowPadX + 16,
        y: pY + slotH / 2,
        text: numStr,
        size: 18,
        weight: 'bold',
        color: isGk ? theme.gkBadge.fill : theme.playerRow.num,
        align: 'left',
      });

      // GK Badge (right side)
      let reservedRight = playerRowPadX + 16;
      if (isGk) {
        const badgeW = 48;
        const badgeH = 26;
        const badgeX = panelX + colWidth - playerRowPadX - badgeW - 12;
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

        reservedRight = colWidth - badgeX + 10;
      }

      // Player Name
      const nameStartX = panelX + playerRowPadX + 46;
      const maxNameWidth = colWidth - nameStartX - reservedRight;
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

  return { width: STORY_WIDTH, height: STORY_HEIGHT, background: theme.bg, commands };
}
