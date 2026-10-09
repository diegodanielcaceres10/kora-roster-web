export interface ParsedPlayerName {
  name: string;
  isGoalkeeper: boolean;
}

// List markers: "1.", "1)", "1 -", "1:", keycap digits, the keycap ten, or a bullet.
// A separator followed by a digit is not a marker ("21:30", "1.5"), and a
// "*" only counts as a bullet when whitespace follows it (otherwise it is bold).
const LEADING_MARKER_REGEX =
  /^\s*(?:(?:\d\uFE0F?\u20E3)+|\u{1F51F}|\d+\s*[.)\-–—:](?!\d)|[-•–—]|\*(?=\s))\s*/u;

const GOALKEEPER_MARKER_SOURCE =
  '\\(\\s*(?:arquero|portero|guardameta|goleiro|goleira|goalkeeper|goalkeper|goalie|gk|🧤)\\s*\\)|🧤';
const GOALKEEPER_MARKER_REGEX = new RegExp(GOALKEEPER_MARKER_SOURCE, 'iu');
const GOALKEEPER_MARKER_ALL_REGEX = new RegExp(GOALKEEPER_MARKER_SOURCE, 'giu');

const BOLD_WRAPPED_REGEX = /^\*([^*]+)\*$/;

const unwrapBold = (text: string): string => text.replace(BOLD_WRAPPED_REGEX, '$1').trim();

function cleanEntry(piece: string): ParsedPlayerName {
  const withoutMarker = unwrapBold(unwrapBold(piece.trim()).replace(LEADING_MARKER_REGEX, ''));
  const isGoalkeeper = GOALKEEPER_MARKER_REGEX.test(withoutMarker);
  const name = unwrapBold(
    withoutMarker.replace(GOALKEEPER_MARKER_ALL_REGEX, '').replace(/\s{2,}/g, ' '),
  );
  return { name, isGoalkeeper };
}

export function parsePastedNames(rawText: string): ParsedPlayerName[] {
  if (!rawText || !rawText.trim()) return [];

  const entries = rawText
    .split(/\r?\n/)
    .flatMap((line) => line.split(/[,;]/))
    .map(cleanEntry)
    .filter((entry) => entry.name.length > 0);

  const unique = new Map<string, ParsedPlayerName>();
  for (const entry of entries) {
    const key = entry.name.toLowerCase();
    const existing = unique.get(key);
    if (!existing) {
      unique.set(key, entry);
    } else if (entry.isGoalkeeper) {
      existing.isGoalkeeper = true;
    }
  }
  return [...unique.values()];
}
