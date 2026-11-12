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
      expect(tooFew(1, 10)).toBe(one);
      expect(tooFew(3, 10)).toBe(many);
    });

    it.each([
      ['en', '1 player too many: the maximum is 22.', '2 players too many: the maximum is 22.'],
      ['es', 'Sobra 1 jugador: el máximo es 22.', 'Sobran 2 jugadores: el máximo es 22.'],
      ['pt', 'Sobra 1 jogador: o máximo é 22.', 'Sobram 2 jogadores: o máximo é 22.'],
    ] as const)('says how many players are too many in %s', (lang, one, many) => {
      const { tooMany } = DICTIONARIES[lang].tool.preview.status;
      expect(tooMany(1, 22)).toBe(one);
      expect(tooMany(2, 22)).toBe(many);
    });

    it.each([
      ['en', '11 players: the number has to be even.'],
      ['es', 'Son 11 jugadores y tiene que ser un número par.'],
      ['pt', 'São 11 jogadores e o número precisa ser par.'],
    ] as const)('explains an odd count in %s', (lang, text) => {
      expect(DICTIONARIES[lang].tool.preview.status.uneven(11, 2)).toBe(text);
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

  describe('the notice about the usual team size', () => {
    it.each([
      ['en', 'You usually play 7 vs 7, but this list has 12 players.', '1 player.'],
      ['es', 'Sueles jugar 7 contra 7, pero esta lista tiene 12 jugadores.', '1 jugador.'],
      ['pt', 'Você costuma jogar 7 contra 7, mas esta lista tem 12 jogadores.', '1 jogador.'],
    ] as const)('says what is usual and what the list has in %s', (lang, text, one) => {
      const { sizeNotice } = DICTIONARIES[lang].tool.preview;
      expect(sizeNotice(7, 2, 12)).toBe(text);
      expect(sizeNotice(7, 2, 1).endsWith(one)).toBe(true);
    });
  });

  describe('the texts that depend on the number of teams', () => {
    it.each([
      ['en', '1 more player needed to reach 15.', '2 players too many: the maximum is 33.'],
      ['es', 'Falta 1 jugador para llegar a 15.', 'Sobran 2 jugadores: el máximo es 33.'],
      ['pt', 'Falta 1 jogador para chegar a 15.', 'Sobram 2 jogadores: o máximo é 33.'],
    ] as const)('names the limits of 3 teams in %s', (lang, few, many) => {
      const { status } = DICTIONARIES[lang].tool.preview;
      expect(status.tooFew(1, 15)).toBe(few);
      expect(status.tooMany(2, 33)).toBe(many);
    });

    it.each([
      ['en', '16 players: with 3 teams the number has to be a multiple of 3.'],
      ['es', 'Son 16 jugadores y con 3 equipos tiene que ser múltiplo de 3.'],
      ['pt', 'São 16 jogadores e com 3 times o número precisa ser múltiplo de 3.'],
    ] as const)('explains an uneven count with 3 teams in %s', (lang, text) => {
      expect(DICTIONARIES[lang].tool.preview.status.uneven(16, 3)).toBe(text);
    });

    it.each([
      ['en', 'You usually play with 7 per team: 3 teams need 21 players, but this list has 12.'],
      [
        'es',
        'Sueles jugar con 7 por equipo: 3 equipos necesitan 21 jugadores, pero esta lista tiene 12.',
      ],
      [
        'pt',
        'Você costuma jogar com 7 por time: 3 times precisam de 21 jogadores, mas esta lista tem 12.',
      ],
    ] as const)('compares the usual size with more than 2 teams in %s', (lang, text) => {
      expect(DICTIONARIES[lang].tool.preview.sizeNotice(7, 3, 12)).toBe(text);
    });
  });

  describe('the texts to swap players', () => {
    it.each([
      [
        'en',
        'Tap a player, then a player from another team, to swap them. You can also drag them.',
        'Selected: Nico. Tap a player from another team.',
        'Nico and Fede swapped.',
      ],
      [
        'es',
        'Tocá un jugador y después uno de otro equipo para intercambiarlos. También podés arrastrarlos.',
        'Seleccionado: Nico. Tocá un jugador de otro equipo.',
        'Nico y Fede intercambiados.',
      ],
      [
        'pt',
        'Toque em um jogador e depois em um de outro time para trocá-los. Você também pode arrastá-los.',
        'Selecionado: Nico. Toque em um jogador de outro time.',
        'Nico e Fede trocados.',
      ],
    ] as const)(
      'say what to do, what was selected and what was swapped in %s',
      (lang, hint, selected, swapped) => {
        const { result } = DICTIONARIES[lang].tool;
        expect(result.swapHint).toBe(hint);
        expect(result.selected('Nico')).toBe(selected);
        expect(result.swapped('Nico', 'Fede')).toBe(swapped);
      },
    );
  });

  describe('the texts to build the teams by hand', () => {
    it.each([
      ['en', 'Without a team', 'Free spot', 'Draw the rest', 'Remove everyone', 'Teams complete'],
      [
        'es',
        'Sin equipo',
        'Lugar libre',
        'Sortear los que faltan',
        'Sacar a todos',
        'Equipos completos',
      ],
      ['pt', 'Sem time', 'Vaga livre', 'Sortear os que faltam', 'Tirar todos', 'Times completos'],
    ] as const)(
      'name the players without a team, the free places and the buttons in %s',
      (lang, pool, freeSlot, drawRemaining, clearTeams, complete) => {
        const { result } = DICTIONARIES[lang].tool;
        expect(result.poolTitle).toBe(pool);
        expect(result.freeSlot).toBe(freeSlot);
        expect(result.drawRemaining).toBe(drawRemaining);
        expect(result.clearTeams).toBe(clearTeams);
        expect(result.complete).toBe(complete);
      },
    );

    it.each([
      ['en', '1 player still needs a team.', '3 players still need a team.'],
      ['es', 'Falta 1 jugador por ubicar.', 'Faltan 3 jugadores por ubicar.'],
      [
        'pt',
        'Falta 1 jogador para colocar em um time.',
        'Faltam 3 jogadores para colocar em um time.',
      ],
    ] as const)(
      'say how many players are missing in %s, in singular and plural',
      (lang, one, many) => {
        const { result } = DICTIONARIES[lang].tool;
        expect(result.missing(1)).toBe(one);
        expect(result.missing(3)).toBe(many);
      },
    );

    it.each([
      ['en', 'Nico moved to Team 2.', 'Nico is now without a team.', 'Move Nico to Team 2'],
      ['es', 'Nico pasó a Equipo 2.', 'Nico quedó sin equipo.', 'Mover a Nico a Equipo 2'],
      ['pt', 'Nico foi para Time 2.', 'Nico ficou sem time.', 'Mover Nico para Time 2'],
    ] as const)(
      'say where a player went and what a free place does in %s',
      (lang, moved, left, moveHere) => {
        const { result, teamTitle } = DICTIONARIES[lang].tool;
        const team = teamTitle(2);
        expect(result.moved('Nico', team)).toBe(moved);
        expect(result.leftTeam('Nico')).toBe(left);
        expect(result.moveHere('Nico', team)).toBe(moveHere);
      },
    );
  });

  describe('the way to the teams without drawing', () => {
    it.each([
      ['en', 'Continue', 'Sign in to build the teams by hand.'],
      ['es', 'Continuar', 'Inicia sesión para armar los equipos a mano.'],
      ['pt', 'Continuar', 'Entre para montar os times à mão.'],
    ] as const)('names the button and explains the lock in %s', (lang, label, signIn) => {
      const { preview } = DICTIONARIES[lang].tool;
      expect(preview.continue).toBe(label);
      expect(preview.manualSignIn).toBe(signIn);
    });
  });

  describe('the confirmation of the teams', () => {
    it.each([
      ['en', 'Confirm', 'Teams confirmed.'],
      ['es', 'Confirmar', 'Equipos confirmados.'],
      ['pt', 'Confirmar', 'Times confirmados.'],
    ] as const)('names the button and says it was done in %s', (lang, confirm, confirmed) => {
      const { result } = DICTIONARIES[lang].tool;
      expect(result.confirm).toBe(confirm);
      expect(result.confirmed).toBe(confirmed);
    });
  });

  describe('the texts that used to be written in the templates', () => {
    it.each([
      [
        'en',
        'Tactical team picker for friendly football',
        'Quick team-building sports utility',
        'Organizer profile',
      ],
      [
        'es',
        'Sorteador táctico de equipos para fútbol entre amigos',
        'Utilidad deportiva de armado rápido',
        'Perfil de Organizador',
      ],
      [
        'pt',
        'Sorteador tático de times para futebol entre amigos',
        'Utilitário esportivo de montagem rápida',
        'Perfil de organizador',
      ],
    ] as const)(
      'name the footer, the landing and the account in %s',
      (lang, footer, landing, account) => {
        const dictionary = DICTIONARIES[lang];
        expect(dictionary.footer.tagline).toBe(footer);
        expect(dictionary.landing.eyebrow).toBe(landing);
        expect(dictionary.account.eyebrow).toBe(account);
      },
    );

    it.each([
      ['en', 'Team customization', 'WhatsApp template'],
      ['es', 'Personalización de equipos', 'Plantilla para WhatsApp'],
      ['pt', 'Personalização dos times', 'Modelo para WhatsApp'],
    ] as const)('name the sections of the preferences in %s', (lang, teams, template) => {
      const { preferences } = DICTIONARIES[lang];
      expect(preferences.teamsSection).toBe(teams);
      expect(preferences.templateSection).toBe(template);
    });

    it.each([
      ['en', 'Friendly mode', 'Draw progress'],
      ['es', 'Modo Amistoso', 'Progreso del sorteo'],
      ['pt', 'Modo Amistoso', 'Progresso do sorteio'],
    ] as const)('name the mode and the progress of the tool in %s', (lang, mode, progress) => {
      const { tool } = DICTIONARIES[lang];
      expect(tool.mode).toBe(mode);
      expect(tool.progressLabel).toBe(progress);
    });

    it.each([
      ['en', '1 player detected', '5 players detected', 'Quick loading guide'],
      ['es', '1 jugador detectado', '5 jugadores detectados', 'Guía de carga rápida'],
      ['pt', '1 jogador detectado', '5 jogadores detectados', 'Guia de carga rápida'],
    ] as const)(
      'count the players detected and title the guide in %s',
      (lang, one, many, title) => {
        const { paste } = DICTIONARIES[lang].tool;
        expect(paste.detected(1)).toBe(one);
        expect(paste.detected(5)).toBe(many);
        expect(paste.guide.title).toBe(title);
      },
    );

    it.each([['en'], ['es'], ['pt']] as const)(
      'write the three steps of the guide in %s, with the word of the goalkeeper between brackets',
      (lang) => {
        const { guide } = DICTIONARIES[lang].tool.paste;
        for (const text of [guide.step1, guide.step2, guide.step3Before, guide.step3After]) {
          expect(text.trim().length).toBeGreaterThan(10);
        }
        expect(guide.step3Word).toMatch(/^\(\p{L}+\)$/u);
      },
    );

    it.each([
      ['en', 'Match settings', '3 teams', 'Per team', 'Goalkeepers', '# Player', 'Actions'],
      [
        'es',
        'Configuración de partido',
        '3 equipos',
        'Por equipo',
        'Arqueros',
        '# Jugador',
        'Acciones',
      ],
      ['pt', 'Configuração da partida', '3 times', 'Por time', 'Goleiros', '# Jogador', 'Ações'],
    ] as const)(
      'name the settings, the figures and the columns of the preview in %s',
      (lang, settings, teams, perTeam, goalkeepers, player, actions) => {
        const { preview } = DICTIONARIES[lang].tool;
        expect(preview.settings).toBe(settings);
        expect(preview.teamsCount(3)).toBe(teams);
        expect(preview.perTeam).toBe(perTeam);
        expect(preview.goalkeepers).toBe(goalkeepers);
        expect(preview.columnPlayer).toBe(player);
        expect(preview.columnActions).toBe(actions);
        expect(preview.editHint.length).toBeGreaterThan(10);
      },
    );

    it.each([
      ['en', '2 balanced teams', 'Ready-to-share format'],
      ['es', '2 equipos equilibrados', 'Formato listo para compartir'],
      ['pt', '2 times equilibrados', 'Formato pronto para compartilhar'],
    ] as const)('name the balance and the format of the result in %s', (lang, balanced, format) => {
      const { result } = DICTIONARIES[lang].tool;
      expect(result.balanced(2)).toBe(balanced);
      expect(result.shareFormat).toBe(format);
      expect(result.imageHint.length).toBeGreaterThan(10);
    });
  });
});
