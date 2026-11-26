import { parsePastedNames } from '../core/parse-players';
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
      [
        'en',
        'Pitch location',
        'For example: 123 Main Street or a Google Maps link',
        'Example pitch, 123 Main Street',
      ],
      [
        'es',
        'Ubicación del campo',
        'Por ejemplo: Calle Principal 123 o un enlace de Google Maps',
        'Cancha de ejemplo, Calle Principal 123',
      ],
      [
        'pt',
        'Localização do campo',
        'Por exemplo: Rua Principal 123 ou um link do Google Maps',
        'Campo de exemplo, Rua Principal 123',
      ],
    ] as const)(
      'names the field of the location and gives an example and a sample in %s',
      (lang, label, example, sample) => {
        const { template } = DICTIONARIES[lang].preferences;
        expect(template.location).toBe(label);
        expect(template.locationPlaceholder).toBe(example);
        expect(template.locationSample).toBe(sample);
      },
    );

    it.each([
      ['en', 'Preview', 'WhatsApp', 'Image', 'Preview of the image to download', 'Preparing the image…'],
      ['es', 'Vista previa', 'WhatsApp', 'Imagen', 'Vista previa de la imagen para descargar', 'Preparando la imagen…'],
      ['pt', 'Prévia', 'WhatsApp', 'Imagem', 'Prévia da imagem para baixar', 'Preparando a imagem…'],
    ] as const)('names the tabs of the preview in %s', (lang, title, message, image, alt, loading) => {
      const { preview } = DICTIONARIES[lang].preferences;
      expect(preview.title).toBe(title);
      expect(preview.messageTab).toBe(message);
      expect(preview.imageTab).toBe(image);
      expect(preview.imageAlt).toBe(alt);
      expect(preview.imageLoading).toBe(loading);
    });

    // The examples of the app have no real names: a numbered player in the language of the page.
    it.each([
      ['en', 'Player 7'],
      ['es', 'Jugador 7'],
      ['pt', 'Jogador 7'],
    ] as const)('names the seventh player of an example in %s', (lang, name) => {
      expect(DICTIONARIES[lang].tool.playerName(7)).toBe(name);
    });

    it.each([
      ['en', 'Edit Jugador A', 'Remove Jugador A'],
      ['es', 'Editar a Jugador A', 'Quitar a Jugador A'],
      ['pt', 'Editar Jugador A', 'Remover Jugador A'],
    ] as const)('names the row buttons after the player in %s', (lang, edit, remove) => {
      const { preview } = DICTIONARIES[lang].tool;
      expect(preview.edit('Jugador A')).toBe(edit);
      expect(preview.remove('Jugador A')).toBe(remove);
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
        'Selected: Jugador G. Tap a player from another team.',
        'Jugador G and Jugador B swapped.',
      ],
      [
        'es',
        'Toca un jugador y después uno de otro equipo para intercambiarlos. También puedes arrastrarlos.',
        'Seleccionado: Jugador G. Toca un jugador de otro equipo.',
        'Jugador G y Jugador B intercambiados.',
      ],
      [
        'pt',
        'Toque em um jogador e depois em um de outro time para trocá-los. Você também pode arrastá-los.',
        'Selecionado: Jugador G. Toque em um jogador de outro time.',
        'Jugador G e Jugador B trocados.',
      ],
    ] as const)(
      'say what to do, what was selected and what was swapped in %s',
      (lang, hint, selected, swapped) => {
        const { result } = DICTIONARIES[lang].tool;
        expect(result.swapHint).toBe(hint);
        expect(result.selected('Jugador G')).toBe(selected);
        expect(result.swapped('Jugador G', 'Jugador B')).toBe(swapped);
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
      ['en', 'Jugador G moved to Team 2.', 'Jugador G is now without a team.', 'Move Jugador G to Team 2'],
      ['es', 'Jugador G pasó a Equipo 2.', 'Jugador G quedó sin equipo.', 'Mover a Jugador G a Equipo 2'],
      ['pt', 'Jugador G foi para Time 2.', 'Jugador G ficou sem time.', 'Mover Jugador G para Time 2'],
    ] as const)(
      'say where a player went and what a free place does in %s',
      (lang, moved, left, moveHere) => {
        const { result, teamTitle } = DICTIONARIES[lang].tool;
        const team = teamTitle(2);
        expect(result.moved('Jugador G', team)).toBe(moved);
        expect(result.leftTeam('Jugador G')).toBe(left);
        expect(result.moveHere('Jugador G', team)).toBe(moveHere);
      },
    );
  });

  describe('the button of step 01 that goes on to review the list', () => {
    it.each([
      ['en', 'Advanced'],
      ['es', 'Avanzado'],
      ['pt', 'Avançado'],
    ] as const)('is called %s in %s', (lang, label) => {
      expect(DICTIONARIES[lang].tool.paste.advanced).toBe(label);
    });
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
      ['en', 'Confirm teams', 'Teams confirmed.'],
      ['es', 'Confirmar equipos', 'Equipos confirmados.'],
      ['pt', 'Confirmar times', 'Times confirmados.'],
    ] as const)('names the button and says it was done in %s', (lang, confirm, confirmed) => {
      const { result } = DICTIONARIES[lang].tool;
      expect(result.confirm).toBe(confirm);
      expect(result.confirmed).toBe(confirmed);
    });
  });

  describe('the texts that used to be written in the templates', () => {
    it.each([
      ['en', 'Tactical team picker for friendly football'],
      ['es', 'Sorteador táctico de equipos para fútbol entre amigos'],
      ['pt', 'Sorteador tático de times para futebol entre amigos'],
    ] as const)('name the footer in %s', (lang, footer) => {
      expect(DICTIONARIES[lang].footer.tagline).toBe(footer);
    });

    it.each([['en'], ['es'], ['pt']] as const)(
      'introduce the account and say what it is for in %s',
      (lang) => {
        const { account } = DICTIONARIES[lang];
        expect(account.title.length).toBeGreaterThan(4);
        expect(account.subtitle.length).toBeGreaterThan(30);
      },
    );

    it.each([
      ['en', 'Any', '7v7 selected', '2 by default', 'Save preferences'],
      ['es', 'Libre', '7v7 seleccionado', '2 por defecto', 'Guardar preferencias'],
      ['pt', 'Livre', '7v7 selecionado', '2 por padrão', 'Salvar preferências'],
    ] as const)(
      'name the choices of the preferences in %s',
      (lang, any, selected, byDefault, save) => {
        const { preferences } = DICTIONARIES[lang];
        expect(preferences.playersPerTeam.any).toBe(any);
        expect(preferences.playersPerTeam.selected('7v7')).toBe(selected);
        expect(preferences.teamCount.default(2)).toBe(byDefault);
        expect(preferences.save).toBe(save);
      },
    );

    it.each([
      ['en', 'opens in a new tab'],
      ['es', 'se abre en una pestaña nueva'],
      ['pt', 'abre em uma nova aba'],
    ] as const)('name the hint of the link in the footer in %s', (lang, newTab) => {
      expect(DICTIONARIES[lang].footer.newTab).toBe(newTab);
    });

    // The landing only promises what the app does. These words come from the behavior of the
    // parser and of the draw, so a promise that stops being true has to be taken out here too.
    it.each([['en'], ['es'], ['pt']] as const)(
      'keeps to what the app does in the landing in %s',
      (lang) => {
        const { landing } = DICTIONARIES[lang];
        expect(landing.hero.checks).toHaveLength(3);
        const everything = JSON.stringify(landing).toLowerCase();
        for (const promise of ['100%', 'garantizad', 'guarantee', 'garantid', 'pro ']) {
          expect(everything, promise).not.toContain(promise);
        }
        // No voseo in the neutral Spanish.
        if (lang === 'es') {
          expect(everything).not.toMatch(/\b(tenés|podés|elegí|empezá|pegá|copiá|probá)\b/);
        }
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
      ['en', 'Draw progress', ['List', 'Review', 'Teams'], 'completed'],
      ['es', 'Progreso del sorteo', ['Lista', 'Revisión', 'Equipos'], 'completado'],
      ['pt', 'Progresso do sorteio', ['Lista', 'Revisão', 'Times'], 'concluído'],
    ] as const)('name the progress and the steps of the tool in %s', (lang, progress, steps, done) => {
      const { tool } = DICTIONARIES[lang];
      expect(tool.progressLabel).toBe(progress);
      expect([tool.steps.list, tool.steps.review, tool.steps.teams]).toEqual(steps);
      expect(tool.stepDone).toBe(done);
    });

    it.each([['en'], ['es'], ['pt']] as const)(
      'title and explain every step of the tool in %s',
      (lang) => {
        const { stepHeader } = DICTIONARIES[lang].tool;
        for (const step of [stepHeader.paste, stepHeader.preview, stepHeader.result, stepHeader.confirmed]) {
          expect(step.title.trim().length).toBeGreaterThan(5);
          expect(step.subtitle.trim().length).toBeGreaterThan(20);
        }
      },
    );

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
      'write the three steps of the guide in %s, each with a title',
      (lang) => {
        const { guide } = DICTIONARIES[lang].tool.paste;
        for (const title of [guide.step1Title, guide.step2Title, guide.step3Title, guide.tag]) {
          expect(title.trim().length).toBeGreaterThan(3);
        }
        for (const text of [guide.step1, guide.step2, guide.step3Before, guide.step3After]) {
          expect(text.trim().length).toBeGreaterThan(3);
        }
      },
    );

    // The guide tells people which words mark a goalkeeper, so every one of them must be
    // understood by the parser that reads the list. Do not promise a word it does not know.
    it.each([['en'], ['es'], ['pt']] as const)(
      'only show goalkeeper words that the parser understands in %s',
      (lang) => {
        const { step3Words } = DICTIONARIES[lang].tool.paste.guide;
        expect(step3Words.length).toBeGreaterThan(0);
        for (const word of step3Words) {
          expect(word).toMatch(/^\(\p{L}+\)$/u);
          expect(parsePastedNames(`Jugador A ${word}`), word).toEqual([
            { name: 'Jugador A', isGoalkeeper: true },
          ]);
        }
      },
    );

    it.each([
      ['en', 'Match settings', 'Teams', 'Per team', 'Goalkeepers', 'Even', 'Uneven'],
      ['es', 'Ajustes del partido', 'Equipos', 'Por equipo', 'Arqueros', 'Parejos', 'Desparejos'],
      ['pt', 'Ajustes da partida', 'Times', 'Por time', 'Goleiros', 'Parelhos', 'Desiguais'],
    ] as const)(
      'name the settings and the figures of the preview in %s',
      (lang, settings, teams, perTeam, goalkeepers, even, uneven) => {
        const { preview } = DICTIONARIES[lang].tool;
        expect(preview.settings).toBe(settings);
        expect(preview.teamsTile).toBe(teams);
        expect(preview.perTeam).toBe(perTeam);
        expect(preview.goalkeepers).toBe(goalkeepers);
        expect(preview.evenTeams).toBe(even);
        expect(preview.unevenTeams).toBe(uneven);
        expect(preview.onePerTeam).toContain('1');
      },
    );

    it.each([['en'], ['es'], ['pt']] as const)(
      'introduce the list and say it is ready in %s, with the number of players',
      (lang) => {
        const { preview } = DICTIONARIES[lang].tool;
        expect(preview.listTitle.length).toBeGreaterThan(5);
        expect(preview.listSubtitle(11)).toContain('11');
        expect(preview.readyDetail(12)).toContain('12');
        expect(preview.drawTeams.length).toBeGreaterThan(4);
        expect(preview.backToList.length).toBeGreaterThan(4);
      },
    );

    it.each([['en'], ['es'], ['pt']] as const)(
      'put the numbers and the names in the messages of the team editor in %s',
      (lang) => {
        const { result } = DICTIONARIES[lang].tool;
        expect(result.imageHint.length).toBeGreaterThan(10);
        expect(result.quota(6)).toContain('6');
        expect(result.waiting(3)).toContain('3');
        expect(result.placed(10, 11)).toContain('10/11');
        for (const text of [
          result.placeAria('Jugador A'),
          result.removeFromTeam('Jugador A'),
        ]) {
          expect(text).toContain('Jugador A');
        }
        expect(result.goalkeeperCount(1)).toContain('1');
        expect(result.goalkeeperCount(2)).toContain('2');
        expect(result.goalkeeperCount(1)).not.toBe(result.goalkeeperCount(2));
      },
    );

    it.each([['en'], ['es'], ['pt']] as const)(
      'say how many players are missing before the teams can be confirmed in %s',
      (lang) => {
        const { confirmLocked } = DICTIONARIES[lang].tool.result;
        expect(confirmLocked(1)).toContain('1');
        expect(confirmLocked(3)).toContain('3');
        expect(confirmLocked(1)).not.toBe(confirmLocked(3));
      },
    );

    it.each([
      ['en', 'Copy for WhatsApp', 'Download image', 'Share image', '1 player', '12 players'],
      ['es', 'Copiar para WhatsApp', 'Descargar imagen', 'Compartir imagen', '1 jugador', '12 jugadores'],
      ['pt', 'Copiar para WhatsApp', 'Baixar imagem', 'Compartilhar imagem', '1 jogador', '12 jogadores'],
    ] as const)(
      'name the actions and the count of the confirmed teams in %s',
      (lang, copy, download, share, one, many) => {
        const { result } = DICTIONARIES[lang].tool;
        expect(result.copy).toBe(copy);
        expect(result.downloadImage).toBe(download);
        expect(result.shareImage).toBe(share);
        expect(result.playersBadge(1)).toBe(one);
        expect(result.playersBadge(12)).toBe(many);
        expect(result.statPlayers.length).toBeGreaterThan(4);
        expect(result.statGoalkeepers.length).toBeGreaterThan(4);
      },
    );

    it.each([['en'], ['es'], ['pt']] as const)(
      'no longer carry the texts of the preview of the image in %s',
      (lang) => {
        const { result } = DICTIONARIES[lang].tool;
        for (const key of ['createImage', 'imageTitle', 'imageAlt', 'closeImage', 'download', 'share']) {
          expect(result, key).not.toHaveProperty(key);
        }
      },
    );

    // The neutral Spanish uses tú, not vos: no "Tocá", "podés" or "Probá" on the screens.
    it('writes the Spanish of the team editor and the image without voseo', () => {
      const { result } = DICTIONARIES.es.tool;
      const texts = [
        result.swapHint,
        result.selected('Jugador A'),
        result.manualHint,
        result.imageFailed,
        result.shareFailed,
      ].join(' ');
      expect(texts).not.toMatch(/\b(tocá|podés|probá|elegí|arrastrá|seleccioná)\b/i);
    });
  });

  describe('the lock on continuing to the list', () => {
    it.each([
      ['en', 'Sign in to review the list and edit the teams.'],
      ['es', 'Inicia sesión para revisar la lista y editar los equipos.'],
      ['pt', 'Entre para revisar a lista e editar os times.'],
    ] as const)('explains it in %s', (lang, text) => {
      expect(DICTIONARIES[lang].tool.paste.reviewSignIn).toBe(text);
    });
  });
});
