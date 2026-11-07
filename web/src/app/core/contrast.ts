const LIGHT = '#ffffff';
const DARK = '#111111';

function channel(value: number): number {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

// WCAG relative luminance, or null when it is not a #rrggbb color.
function luminance(hex: string): number | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return null;
  const n = parseInt(match[1], 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

export function contrastRatio(a: string, b: string): number {
  const first = luminance(a) ?? 0;
  const second = luminance(b) ?? 0;
  const [lighter, darker] = first > second ? [first, second] : [second, first];
  return (lighter + 0.05) / (darker + 0.05);
}

// White or near black, whichever reads better on the given background.
export function readableTextColor(background: string): typeof LIGHT | typeof DARK {
  if (luminance(background) === null) return LIGHT;
  return contrastRatio(background, DARK) > contrastRatio(background, LIGHT) ? DARK : LIGHT;
}
