import { computeGeometry } from './geometry';
import {
  GAP,
  HEADER_STYLE,
  LOCATION_STYLE,
  STORY_HEIGHT,
  STORY_WIDTH,
  TOP_ROW_HEIGHT,
} from './metrics';
import { brandCommand, footerCommands } from './sections/closing';
import { infoCardCommands } from './sections/info-card';
import { matchdayCommands } from './sections/matchday-card';
import { plateCommand } from './sections/plate';
import { teamPanelCommands } from './sections/team-panel';
import { topRowCommands } from './sections/top-row';
import { ThemeTokens, themeFor } from './theme';
import { Measure, StoryCommand, StoryInput, StoryLayout } from './types';

// A story without teams is only the empty plate in the middle of the page.
const EMPTY_PLATE_HEIGHT = 300;

const layoutOf = (theme: ThemeTokens, commands: StoryCommand[]): StoryLayout => ({
  width: STORY_WIDTH,
  height: STORY_HEIGHT,
  background: theme.bg,
  commands,
});

// The drawing of the story as a list of commands, from the top of the plate to the bottom.
// It does not draw: whoever has a canvas follows the commands.
export function layoutStory(input: StoryInput, measure: Measure): StoryLayout {
  const theme = themeFor(input.theme);

  if (input.teams.length === 0) {
    const y = (STORY_HEIGHT - EMPTY_PLATE_HEIGHT) / 2;
    return layoutOf(theme, [plateCommand(theme, y, EMPTY_PLATE_HEIGHT)]);
  }

  const geometry = computeGeometry(input, measure);
  const commands: StoryCommand[] = [
    plateCommand(theme, geometry.plateY, geometry.plateHeight),
    ...topRowCommands(theme, geometry.startY, measure),
  ];
  let y = geometry.startY + TOP_ROW_HEIGHT + GAP;

  if (geometry.headerCardHeight > 0) {
    commands.push(
      ...infoCardCommands(
        theme,
        {
          rectRole: 'header-card',
          textRole: 'header',
          style: HEADER_STYLE,
          lines: geometry.headerLines,
          height: geometry.headerCardHeight,
        },
        y,
      ),
    );
    y += geometry.headerCardHeight + GAP;
  }

  if (geometry.locationHeight > 0) {
    commands.push(
      ...infoCardCommands(
        theme,
        {
          rectRole: 'location-card',
          textRole: 'location',
          style: LOCATION_STYLE,
          lines: geometry.locationLines,
          height: geometry.locationHeight,
        },
        y,
      ),
    );
    y += geometry.locationHeight + GAP;
  }

  if (geometry.matchdayHeight > 0) {
    commands.push(...matchdayCommands(theme, input.teams[0], input.teams[1], y, measure));
    y += geometry.matchdayHeight + GAP;
  }

  input.teams.forEach((team, index) => {
    commands.push(...teamPanelCommands(theme, geometry, team, index, y, input.numbering, measure));
  });
  y += geometry.panelsHeight + GAP;

  if (geometry.footerHeight > 0) {
    commands.push(...footerCommands(theme, geometry.footerLines, y));
    y += geometry.footerHeight + GAP;
  }

  commands.push(brandCommand(theme, input.brand, y));
  return layoutOf(theme, commands);
}
