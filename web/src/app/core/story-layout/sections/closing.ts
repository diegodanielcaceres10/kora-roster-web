import { BRAND_HEIGHT, FOOTER_STYLE, STORY_WIDTH } from '../metrics';
import { tidy } from '../text-fit';
import { ThemeTokens } from '../theme';
import { StoryCommand, TextCommand } from '../types';

const DEFAULT_BRAND = 'GENERADO CON KORA ROSTER';

// The footer message, centered above the brand line.
export function footerCommands(
  theme: ThemeTokens,
  lines: readonly string[],
  y: number,
): StoryCommand[] {
  return lines.map((line, i): TextCommand => ({
    kind: 'text',
    role: 'footer',
    x: STORY_WIDTH / 2,
    y: y + FOOTER_STYLE.lineHeight / 2 + i * FOOTER_STYLE.lineHeight,
    text: line,
    size: FOOTER_STYLE.size,
    weight: FOOTER_STYLE.weight,
    color: theme.infoCard.text,
    align: 'center',
  }));
}

// The brand at the bottom of the plate.
export function brandCommand(theme: ThemeTokens, brand: string, y: number): TextCommand {
  return {
    kind: 'text',
    role: 'brand',
    x: STORY_WIDTH / 2,
    y: y + BRAND_HEIGHT / 2,
    text: tidy(brand || DEFAULT_BRAND).toUpperCase(),
    size: 22,
    weight: 'bold',
    color: theme.footer,
    align: 'center',
  };
}
