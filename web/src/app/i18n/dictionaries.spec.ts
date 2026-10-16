import { DICTIONARIES } from './dictionaries';
import { SUPPORTED_LANGS } from './languages';

type Fn = (...args: never[]) => string;

interface Tree {
  [key: string]: string | Fn | Tree;
}

// Texts with numbers or names are functions; they count as one leaf each.
function leaves(tree: Tree, prefix = ''): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'object'
      ? leaves(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, typeof value === 'string' ? value : '<function>'] as [string, string]],
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

  describe('tool texts with numbers and names', () => {
    it.each([
      ['en', '1 player', '12 players'],
      ['es', '1 jugador', '12 jugadores'],
      ['pt', '1 jogador', '12 jogadores'],
    ] as const)('counts players in %s', (lang, one, many) => {
      const { count } = DICTIONARIES[lang].tool.preview;
      expect(count(1)).toBe(one);
      expect(count(12)).toBe(many);
    });

    it.each([
      ['en', '1 more player needed to reach 10.', '3 more players needed to reach 10.'],
      ['es', 'Falta 1 jugador para llegar a 10.', 'Faltan 3 jugadores para llegar a 10.'],
      ['pt', 'Falta 1 jogador para chegar a 10.', 'Faltam 3 jogadores para chegar a 10.'],
    ] as const)('says how many players are missing in %s', (lang, one, many) => {
      const { tooFew } = DICTIONARIES[lang].tool.preview.status;
      expect(tooFew(1)).toBe(one);
      expect(tooFew(3)).toBe(many);
    });

    it.each([
      ['en', '1 player too many: the maximum is 22.', '2 players too many: the maximum is 22.'],
      ['es', 'Sobra 1 jugador: el máximo es 22.', 'Sobran 2 jugadores: el máximo es 22.'],
      ['pt', 'Sobra 1 jogador: o máximo é 22.', 'Sobram 2 jogadores: o máximo é 22.'],
    ] as const)('says how many players are too many in %s', (lang, one, many) => {
      const { tooMany } = DICTIONARIES[lang].tool.preview.status;
      expect(tooMany(1)).toBe(one);
      expect(tooMany(2)).toBe(many);
    });

    it.each([
      ['en', '11 players: the number has to be even.'],
      ['es', 'Son 11 jugadores y tiene que ser un número par.'],
      ['pt', 'São 11 jogadores e o número precisa ser par.'],
    ] as const)('explains an odd count in %s', (lang, text) => {
      expect(DICTIONARIES[lang].tool.preview.status.odd(11)).toBe(text);
    });

    it.each([
      ['en', 'Team 2'],
      ['es', 'Equipo 2'],
      ['pt', 'Time 2'],
    ] as const)('titles the second team in %s', (lang, title) => {
      expect(DICTIONARIES[lang].tool.teamTitle(2)).toBe(title);
    });

    it.each([
      ['en', 'Edit Diego', 'Remove Diego'],
      ['es', 'Editar a Diego', 'Quitar a Diego'],
      ['pt', 'Editar Diego', 'Remover Diego'],
    ] as const)('names the row buttons after the player in %s', (lang, edit, remove) => {
      const { preview } = DICTIONARIES[lang].tool;
      expect(preview.edit('Diego')).toBe(edit);
      expect(preview.remove('Diego')).toBe(remove);
    });
  });

  describe('preference texts that take a team name', () => {
    it.each([
      ['en', 'Team 1: icon', 'Team 1: color'],
      ['es', 'Equipo 1: ícono', 'Equipo 1: color'],
      ['pt', 'Time 1: ícone', 'Time 1: cor'],
    ] as const)('names the icon and the color of a team in %s', (lang, icon, color) => {
      const { teams } = DICTIONARIES[lang].preferences;
      const title = DICTIONARIES[lang].tool.teamTitle(1);
      expect(teams.iconLabel(title)).toBe(icon);
      expect(teams.colorLabel(title)).toBe(color);
    });
  });
});
