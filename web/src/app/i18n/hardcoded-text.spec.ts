import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Names and labels that read the same in every language.
const SAME_IN_EVERY_LANGUAGE = new Set([
  'Kora',
  'Roster',
  'Kora Roster',
  'Matchday Tool',
  'English',
  'Español',
  'Português',
]);

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const components = walk('src/app').filter(
  (file) =>
    file.endsWith('.ts') && !file.endsWith('.spec.ts') && !/i18n[/\\](en|es|pt)\.ts$/.test(file),
);

const isText = (text: string) => /\p{L}/u.test(text) && !SAME_IN_EVERY_LANGUAGE.has(text);

// The text of a template that does not come from the dictionaries: words between tags, words
// between quotes inside an interpolation, and the literal accessibility attributes.
function untranslated(file: string): string[] {
  const template = /template:\s*`([\s\S]*?)`/.exec(readFileSync(file, 'utf8'))?.[1] ?? '';
  const found: string[] = [];

  for (const [, node] of template.matchAll(/>([^<>]*)</g)) {
    for (const [, quoted] of node.matchAll(/\{\{[^}]*?'([^'}]*)'[^}]*\}\}/g)) {
      if (isText(quoted.trim())) found.push(quoted.trim());
    }
    const plain = node
      .replace(/\{\{[\s\S]*?\}\}/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // What starts with @ or keeps braces is control flow, which is code. A comparison inside
    // its condition can cut it in two, so the cut part is skipped as well.
    if (!plain.startsWith('@') && !/[{}]/.test(plain) && isText(plain)) found.push(plain);
  }

  for (const [, , value] of template.matchAll(
    /\s(aria-label|placeholder|title|alt|label)="([^"{}]*)"/g,
  )) {
    if (isText(value.trim())) found.push(value.trim());
  }
  return found;
}

describe('the texts written in the templates', () => {
  it('all come from the dictionaries, so they are translated', () => {
    const found = components.flatMap((file) =>
      untranslated(file).map((text) => `${file}: ${text}`),
    );
    expect(found).toEqual([]);
  });
});
