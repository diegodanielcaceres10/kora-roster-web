import { DICTIONARIES } from './dictionaries';
import { SUPPORTED_LANGS } from './languages';

interface Tree {
  [key: string]: string | Tree;
}

function leaves(tree: Tree, prefix = ''): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [[`${prefix}${key}`, value] as [string, string]]
      : leaves(value, `${prefix}${key}.`),
  );
}

describe('dictionaries', () => {
  it('has one dictionary per supported language', () => {
    expect(Object.keys(DICTIONARIES).sort()).toEqual([...SUPPORTED_LANGS].sort());
  });

  it.each(SUPPORTED_LANGS)('has the same keys in %s as in English', (lang) => {
    const english = leaves(DICTIONARIES.en as unknown as Tree).map(([key]) => key);
    const other = leaves(DICTIONARIES[lang] as unknown as Tree).map(([key]) => key);
    expect(other).toEqual(english);
  });

  it.each(SUPPORTED_LANGS)('has no empty text in %s', (lang) => {
    const empty = leaves(DICTIONARIES[lang] as unknown as Tree)
      .filter(([, text]) => text.trim() === '')
      .map(([key]) => key);
    expect(empty).toEqual([]);
  });
});
