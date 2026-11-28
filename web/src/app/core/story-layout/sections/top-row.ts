import { CONTENT_LEFT, TOP_ROW_HEIGHT } from '../metrics';
import { ThemeTokens } from '../theme';
import { Measure, StoryCommand } from '../types';

// The logo of the first row: the mark, the name and the Roster tag, all centered on the line
// of the row. The tag is a little shorter than the row so it reads as a tag of the name.
const WORDMARK = 'KORA';
const WORDMARK_SIZE = 34;
const TAG_LABEL = 'ROSTER';
const TAG_SIZE = 18;
const TAG_PAD_X = 18;
const TAG_HEIGHT = 34;
const LOGO_GAP = 14;

export function topRowCommands(
  theme: ThemeTokens,
  startY: number,
  measure: Measure,
): StoryCommand[] {
  const rowCenter = startY + TOP_ROW_HEIGHT / 2;
  const wordmarkX = CONTENT_LEFT + TOP_ROW_HEIGHT + LOGO_GAP;
  const tagX = wordmarkX + measure(WORDMARK, WORDMARK_SIZE, 'bold') + LOGO_GAP;
  const tagWidth = measure(TAG_LABEL, TAG_SIZE, 'bold') + 2 * TAG_PAD_X;

  return [
    {
      kind: 'image',
      role: 'logo',
      x: CONTENT_LEFT,
      y: startY,
      width: TOP_ROW_HEIGHT,
      height: TOP_ROW_HEIGHT,
    },
    {
      kind: 'text',
      role: 'wordmark',
      x: wordmarkX,
      y: rowCenter,
      text: WORDMARK,
      size: WORDMARK_SIZE,
      weight: 'bold',
      color: theme.wordmark,
      align: 'left',
    },
    {
      kind: 'rect',
      role: 'brand-pill',
      x: tagX,
      y: rowCenter - TAG_HEIGHT / 2,
      width: tagWidth,
      height: TAG_HEIGHT,
      radius: TAG_HEIGHT / 2,
      fill: theme.brandPill.fill,
      stroke: { color: theme.brandPill.stroke, width: 2 },
    },
    {
      kind: 'text',
      role: 'brand-pill',
      x: tagX + tagWidth / 2,
      y: rowCenter,
      text: TAG_LABEL,
      size: TAG_SIZE,
      weight: 'bold',
      color: theme.brandPill.text,
      align: 'center',
    },
  ];
}
