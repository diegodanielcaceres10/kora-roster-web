import { Numbering, numberLabel } from '../../format-teams';
import { StoryGeometry } from '../geometry';
import { CONTENT_LEFT, GAP, PANEL_HEADER_HEIGHT, RADIUS } from '../metrics';
import { ThemeTokens } from '../theme';
import { Measure, StoryCommand, StoryTeam } from '../types';
import { playerRowCommands } from './player-row';

const HEADER_PAD_X = 18;
const ROWS_INSET_TOP = 8;
const ROWS_INSET_X = 14;

// One team: its panel with the colored header, and under it a row for each player.
export function teamPanelCommands(
  theme: ThemeTokens,
  geometry: StoryGeometry,
  team: StoryTeam,
  index: number,
  panelsTop: number,
  numbering: Numbering,
  measure: Measure,
): StoryCommand[] {
  const { columns, colWidth, panelHeight, slotH, rowGap, teamCount } = geometry;
  const rowIdx = Math.floor(index / columns);
  const colIdx = index % columns;
  // A last row with fewer panels than columns is centered under the others.
  const inRow = Math.min(columns, teamCount - rowIdx * columns);
  const rowOffset = ((columns - inRow) * (colWidth + GAP)) / 2;
  const panelX = CONTENT_LEFT + rowOffset + colIdx * (colWidth + GAP);
  const panelY = panelsTop + rowIdx * (panelHeight + GAP);

  const accent = team.color || theme.teamPanel.stroke;
  // Header tint: the team color at ~18% opacity, for a subtle look.
  const tint = `${accent}2E`;
  const titleUpper = team.title.toUpperCase();
  const title = titleUpper.startsWith('TEAM') ? titleUpper : `TEAM ${titleUpper}`;

  const commands: StoryCommand[] = [
    {
      kind: 'rect',
      role: 'panel',
      team: index,
      x: panelX,
      y: panelY,
      width: colWidth,
      height: panelHeight,
      radius: RADIUS,
      fill: theme.teamPanel.fill,
      // Subtle border: team color at ~44% opacity, thinner stroke
      stroke: { color: `${accent}70`, width: 1.5 },
    },
    // Drawn after the panel so it sits inside the border.
    {
      kind: 'rect',
      role: 'title-bar',
      team: index,
      x: panelX + 1.5,
      y: panelY + 1.5,
      width: colWidth - 3,
      height: PANEL_HEADER_HEIGHT - 1.5,
      radius: RADIUS - 1,
      fill: tint,
    },
    // Square off the bottom corners of the tint (canvas rounded-rect bleeds into body)
    {
      kind: 'rect',
      role: 'title-bar',
      team: index,
      x: panelX + 1.5,
      y: panelY + PANEL_HEADER_HEIGHT / 2,
      width: colWidth - 3,
      height: PANEL_HEADER_HEIGHT / 2,
      radius: 0,
      fill: tint,
    },
    {
      kind: 'text',
      role: 'title',
      team: index,
      x: panelX + HEADER_PAD_X,
      y: panelY + PANEL_HEADER_HEIGHT / 2,
      text: title,
      size: 22,
      weight: 'bold',
      // The team color on the subtle tint stays readable.
      color: team.color,
      align: 'left',
    },
    {
      kind: 'text',
      role: 'title',
      team: index,
      x: panelX + colWidth - HEADER_PAD_X,
      y: panelY + PANEL_HEADER_HEIGHT / 2,
      text: `${team.players.length} JUG.`,
      size: 18,
      weight: 'bold',
      color: theme.teamPanel.count,
      align: 'right',
    },
  ];

  const rowsTop = panelY + PANEL_HEADER_HEIGHT + ROWS_INSET_TOP;
  team.players.forEach((player, playerIdx) => {
    commands.push(
      ...playerRowCommands(
        theme,
        {
          x: panelX + ROWS_INSET_X,
          y: rowsTop + playerIdx * (slotH + rowGap),
          width: colWidth - 2 * ROWS_INSET_X,
          height: slotH,
        },
        index,
        player,
        numberLabel(playerIdx + 1, numbering),
        measure,
      ),
    );
  });
  return commands;
}
