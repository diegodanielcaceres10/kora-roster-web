import { CONTENT_LEFT, CONTENT_WIDTH, INFO_TEXT_INSET, TextBlockStyle } from '../metrics';
import { ThemeTokens } from '../theme';
import { RectCommand, StoryCommand, TextCommand } from '../types';

// A card of wrapped text under the top row: the header of the message or the location.
export interface InfoCard {
  rectRole: RectCommand['role'];
  textRole: TextCommand['role'];
  style: TextBlockStyle;
  lines: readonly string[];
  height: number;
}

export function infoCardCommands(theme: ThemeTokens, card: InfoCard, y: number): StoryCommand[] {
  const { style } = card;
  return [
    {
      kind: 'rect',
      role: card.rectRole,
      x: CONTENT_LEFT,
      y,
      width: CONTENT_WIDTH,
      height: card.height,
      radius: 18,
      fill: theme.infoCard.fill,
      stroke: { color: theme.infoCard.stroke, width: 1.5 },
    },
    ...card.lines.map((line, i): TextCommand => ({
      kind: 'text',
      role: card.textRole,
      x: CONTENT_LEFT + INFO_TEXT_INSET,
      y: y + style.padY + style.lineHeight / 2 + i * style.lineHeight,
      text: line,
      size: style.size,
      weight: style.weight,
      color: theme.infoCard.text,
      align: 'left',
    })),
  ];
}
