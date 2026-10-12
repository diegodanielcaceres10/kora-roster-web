import { readFileSync } from 'node:fs';
import * as ui from './index';

// README.md is the reference that future work reads before creating a UI element,
// so it must list exactly what the barrel exports.
const readme = readFileSync('src/app/ui/README.md', 'utf8');
const exported = Object.keys(ui);

describe('UI catalog (ui/README.md)', () => {
  it.each(exported)('documents %s', (name) => {
    expect(readme).toContain(`\`${name}\``);
  });

  it('does not mention components that are no longer exported', () => {
    const mentioned = [...readme.matchAll(/`(Ui[A-Z][A-Za-z]*)`/g)].map((match) => match[1]);
    expect(mentioned.filter((name) => !exported.includes(name))).toEqual([]);
  });
});
