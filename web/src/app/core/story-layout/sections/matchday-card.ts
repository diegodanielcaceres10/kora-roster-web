import { CONTENT_LEFT, CONTENT_WIDTH, MATCHDAY_HEIGHT } from '../metrics';
import { truncate } from '../text-fit';
import { ThemeTokens } from '../theme';
import { Measure, StoryCommand, StoryTeam } from '../types';

const CARD_RADIUS = 24;
const SIDE_INSET = 24;
const DOT_RADIUS = 8;
const TITLE_SIZE = 32;
const VS_RADIUS = 38;

// One side of the card: the dot and the label of the side, and under them the team title.
function sideCommands(
  theme: ThemeTokens,
  side: 'left' | 'right',
  label: string,
  team: StoryTeam,
  titleColor: string,
  midX: number,
  midY: number,
  measure: Measure,
): StoryCommand[] {
  const isLeft = side === 'left';
  const edge = isLeft ? CONTENT_LEFT + SIDE_INSET : CONTENT_LEFT + CONTENT_WIDTH - SIDE_INSET;
  const dotX = isLeft ? edge : edge - DOT_RADIUS * 2;
  const labelX = isLeft ? edge + DOT_RADIUS * 2 + 10 : edge - DOT_RADIUS * 2 - 10;
  const title = truncate(
    team.title.toUpperCase(),
    midX - CONTENT_LEFT - 120,
    TITLE_SIZE,
    'bold',
    measure,
  );

  return [
    {
      kind: 'rect',
      role: 'matchday-card',
      x: dotX,
      y: midY - 26,
      width: DOT_RADIUS * 2,
      height: DOT_RADIUS * 2,
      radius: DOT_RADIUS,
      fill: team.color,
    },
    {
      kind: 'text',
      role: 'matchday',
      x: labelX,
      y: midY - 26 + DOT_RADIUS,
      text: label,
      size: 16,
      weight: 'bold',
      color: theme.matchdayCard.label,
      align: side,
    },
    {
      kind: 'text',
      role: 'matchday',
      x: edge,
      y: midY + 18,
      text: title,
      size: TITLE_SIZE,
      weight: 'bold',
      color: titleColor,
      align: side,
    },
  ];
}

// The card with the two teams face to face, for a story with exactly two teams.
export function matchdayCommands(
  theme: ThemeTokens,
  teamA: StoryTeam,
  teamB: StoryTeam,
  y: number,
  measure: Measure,
): StoryCommand[] {
  const midX = CONTENT_LEFT + CONTENT_WIDTH / 2;
  const midY = y + MATCHDAY_HEIGHT / 2;

  return [
    {
      kind: 'rect',
      role: 'matchday-card',
      x: CONTENT_LEFT,
      y,
      width: CONTENT_WIDTH,
      height: MATCHDAY_HEIGHT,
      radius: CARD_RADIUS,
      fill: theme.matchdayCard.fill,
      stroke: { color: theme.matchdayCard.stroke, width: 1.5 },
    },
    ...sideCommands(theme, 'left', 'LADO A', teamA, teamA.color, midX, midY, measure),
    // Center VS circle
    {
      kind: 'rect',
      role: 'matchday-card',
      x: midX - VS_RADIUS,
      y: midY - VS_RADIUS - 6,
      width: VS_RADIUS * 2,
      height: VS_RADIUS * 2,
      radius: VS_RADIUS,
      fill: theme.vsBadge.fill,
      stroke: { color: theme.vsBadge.border, width: 2 },
    },
    {
      kind: 'text',
      role: 'matchday',
      x: midX,
      y: midY - 6,
      text: 'VS',
      size: 26,
      weight: 'bold',
      color: theme.vsBadge.text,
      align: 'center',
    },
    {
      kind: 'text',
      role: 'matchday',
      x: midX,
      y: midY + VS_RADIUS + 4,
      text: 'MATCHDAY',
      size: 13,
      weight: 'bold',
      color: theme.vsBadge.subtext,
      align: 'center',
    },
    ...sideCommands(theme, 'right', 'LADO B', teamB, theme.matchdayCard.text, midX, midY, measure),
  ];
}
