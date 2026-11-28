import { FontWeight, Measure } from './types';

const ELLIPSIS = '…';

export const tidy = (text: string) => text.replace(/\s+/g, ' ').trim();

export function truncate(
  text: string,
  maxWidth: number,
  size: number,
  weight: FontWeight,
  measure: Measure,
) {
  if (maxWidth <= 0) return ELLIPSIS;
  if (measure(text, size, weight) <= maxWidth) return text;
  const letters = Array.from(text);
  for (let kept = letters.length - 1; kept > 0; kept--) {
    const candidate = `${letters.slice(0, kept).join('').trimEnd()}${ELLIPSIS}`;
    if (measure(candidate, size, weight) <= maxWidth) return candidate;
  }
  return ELLIPSIS;
}

// Breaks the text into as many lines as needed to fit in `maxWidth` without ellipsis.
// A single word wider than `maxWidth` is split across lines by character.
export function wrapLines(
  text: string,
  maxWidth: number,
  size: number,
  weight: FontWeight,
  measure: Measure,
): string[] {
  if (!text) return [];
  const lines: string[] = [];
  let current = '';

  const pushWord = (word: string) => {
    if (measure(word, size, weight) <= maxWidth) {
      current = word;
      return;
    }
    let chunk = '';
    for (const ch of Array.from(word)) {
      const next = chunk + ch;
      if (chunk && measure(next, size, weight) > maxWidth) {
        lines.push(chunk);
        chunk = ch;
      } else {
        chunk = next;
      }
    }
    current = chunk;
  };

  for (const word of text.split(' ')) {
    if (!current) {
      pushWord(word);
      continue;
    }
    const candidate = `${current} ${word}`;
    if (measure(candidate, size, weight) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      pushWord(word);
    }
  }
  if (current) lines.push(current);
  return lines;
}

// The same as `wrapLines`, for text as the person typed it: whitespace is tidied first.
export function wrapText(
  text: string,
  maxWidth: number,
  size: number,
  weight: FontWeight,
  measure: Measure,
): string[] {
  return wrapLines(tidy(text), maxWidth, size, weight, measure);
}
