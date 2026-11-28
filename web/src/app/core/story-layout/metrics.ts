import { FontWeight } from './types';

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

export const GAP = 20;
export const RADIUS = 28;

// The plate holds everything. Its content sits in a column inside its padding.
export const PLATE_MARGIN = 36;
export const PLATE_PADDING = 36;
export const PLATE_PAD_Y = 24;
export const PLATE_RADIUS = 48;
export const PLATE_WIDTH = STORY_WIDTH - 2 * PLATE_MARGIN;
export const CONTENT_LEFT = PLATE_MARGIN + PLATE_PADDING;
export const CONTENT_WIDTH = PLATE_WIDTH - 2 * PLATE_PADDING;
// The most the content of the plate can take: the story, the margins and the padding of the plate.
export const MAX_CONTENT_H = STORY_HEIGHT - 2 * PLATE_MARGIN - 2 * PLATE_PAD_Y;

// Heights of the fixed parts.
export const TOP_ROW_HEIGHT = 56;
export const MATCHDAY_HEIGHT = 116;
export const BRAND_HEIGHT = 36;
export const PANEL_HEADER_HEIGHT = 56;
export const PANEL_PAD_Y = 16;

// Header, location and footer: wrapped without ellipsis across as many lines as needed.
export interface TextBlockStyle {
  size: number;
  lineHeight: number;
  padY: number;
  weight: FontWeight;
}
export const HEADER_STYLE: TextBlockStyle = { size: 24, lineHeight: 32, padY: 14, weight: 'bold' };
export const LOCATION_STYLE: TextBlockStyle = {
  size: 22,
  lineHeight: 30,
  padY: 13,
  weight: 'normal',
};
export const FOOTER_STYLE: TextBlockStyle = { size: 22, lineHeight: 30, padY: 0, weight: 'normal' };
// How far the text of a card sits from the sides of the card.
export const INFO_TEXT_INSET = 20;

// The rows of players: no shorter than MIN_SLOT and no taller than MAX_SLOT.
export const MIN_SLOT = 48;
export const MAX_SLOT = 72;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const gapOf = (slot: number) => clamp(Math.floor(slot * 0.16), 8, 12);

// The tallest slot so that `count` of them, with their gaps, fit in `area` (never under MIN_SLOT).
export function fitSlot(area: number, count: number): number {
  for (let slot = MAX_SLOT; slot > MIN_SLOT; slot--) {
    if (count * slot + (count - 1) * gapOf(slot) <= area) return slot;
  }
  return MIN_SLOT;
}
