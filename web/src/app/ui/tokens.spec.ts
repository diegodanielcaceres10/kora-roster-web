import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// The shared components are the ones that must look right in both modes, so they may not
// carry a fixed light color. Use the tokens instead (bg-surface, text-ink, border-line...;
// see styles.css and ui/README.md). The brand colors are fine where they never change:
// text-secondary on a bg-primary surface, and text-white on a bg-alternative one.
const FIXED_LIGHT = /\b(?:bg|border|text|divide|ring|outline|placeholder:text)-(?:white|secondary)\b/;

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
  });
}

function offending(file: string): string[] {
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => FIXED_LIGHT.test(line))
    .filter(({ line }) => !(line.includes('bg-primary') && line.includes('text-secondary')))
    .filter(({ line }) => !(line.includes('bg-alternative') && line.includes('text-white')))
    .map(({ line, number }) => `${file}:${number}: ${line.trim()}`);
}

describe('shared UI components', () => {
  it.each(sources('src/app/ui'))('%s has no fixed light color', (file) => {
    expect(offending(file)).toEqual([]);
  });
});
