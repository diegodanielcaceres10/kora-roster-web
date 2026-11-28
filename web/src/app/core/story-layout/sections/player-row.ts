import { truncate } from '../text-fit';
import { ThemeTokens } from '../theme';
import { Measure, StoryCommand, StoryPlayer } from '../types';

const NUMBER_INSET = 16;
const NAME_INSET = 48;
const NAME_SIZE = 20;
const BADGE_WIDTH = 50;
const BADGE_HEIGHT = 28;

export interface RowFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

// One player: the row, the number, the badge when it is a goalkeeper and the name.
export function playerRowCommands(
  theme: ThemeTokens,
  row: RowFrame,
  team: number,
  player: StoryPlayer,
  numberText: string,
  measure: Measure,
): StoryCommand[] {
  const isGk = player.isGoalkeeper;
  const midY = row.y + row.height / 2;
  const commands: StoryCommand[] = [
    {
      kind: 'rect',
      role: isGk ? 'highlight' : 'player-row',
      team,
      x: row.x,
      y: row.y,
      width: row.width,
      height: row.height,
      radius: 12,
      fill: isGk ? theme.gkRow.fill : theme.playerRow.fill,
      stroke: { color: isGk ? theme.gkRow.stroke : theme.playerRow.stroke, width: 1.5 },
    },
    {
      kind: 'text',
      role: 'player',
      team,
      x: row.x + NUMBER_INSET,
      y: midY,
      text: numberText,
      size: 18,
      weight: 'bold',
      color: isGk ? theme.gkBadge.fill : theme.playerRow.num,
      align: 'left',
    },
  ];

  let reservedRight = 16;
  if (isGk) {
    const badgeX = row.x + row.width - BADGE_WIDTH - 12;
    const badgeY = row.y + (row.height - BADGE_HEIGHT) / 2;
    commands.push(
      {
        kind: 'rect',
        role: 'badge',
        team,
        x: badgeX,
        y: badgeY,
        width: BADGE_WIDTH,
        height: BADGE_HEIGHT,
        radius: 8,
        fill: theme.gkBadge.fill,
      },
      {
        kind: 'text',
        role: 'badge',
        team,
        x: badgeX + BADGE_WIDTH / 2,
        y: badgeY + BADGE_HEIGHT / 2,
        text: 'GK',
        size: 14,
        weight: 'bold',
        color: theme.gkBadge.text,
        align: 'center',
      },
    );
    reservedRight = BADGE_WIDTH + 24;
  }

  // The room for the name is worked out from the row, whatever the position of its panel.
  const weight = isGk ? 'bold' : 'normal';
  const maxNameWidth = row.width - NAME_INSET - reservedRight;
  commands.push({
    kind: 'text',
    role: 'player',
    team,
    x: row.x + NAME_INSET,
    y: midY,
    text: truncate(player.name, maxNameWidth, NAME_SIZE, weight, measure),
    size: NAME_SIZE,
    weight,
    color: theme.playerRow.text,
    align: 'left',
  });
  return commands;
}
