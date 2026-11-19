import type { Dictionary } from './en';

export const pt: Dictionary = {
  language: {
    label: 'Idioma',
  },
  theme: {
    toDark: 'Mudar para o modo escuro',
    toLight: 'Mudar para o modo claro',
  },
  meta: {
    landing: {
      title: 'Kora Roster – Monte os times da partida em segundos',
      description:
        'Cole a lista do grupo do WhatsApp e receba dois times sorteados e equilibrados, com os goleiros separados, prontos para enviar.',
    },
    tool: {
      title: 'Amistoso rápido – Kora Roster',
      description:
        'Cole a lista, confira os nomes, sorteie dois times e copie a mensagem para o seu grupo do WhatsApp.',
    },
    account: {
      title: 'Minha conta – Kora Roster',
      description: 'Entre com o Google e gerencie suas preferências do Kora Roster.',
    },
  },
  account: {
    eyebrow: 'Perfil de organizador',
    title: 'Minha conta',
    signInLink: 'Entrar',
    signInPrompt: 'Entre com sua conta do Google para salvar suas preferências neste dispositivo.',
    unavailable: 'O login ainda não está disponível.',
    scriptError:
      'Não foi possível carregar o login do Google. Verifique sua conexão e tente novamente.',
    invalidToken: 'Não foi possível verificar o login. Tente novamente.',
    signOut: 'Sair',
    nameLabel: 'Nome',
    emailLabel: 'E-mail',
  },
  locks: {
    signInLink: 'Entrar',
    premiumLabel: 'Premium',
    premiumSoon: 'Disponível com o Premium, em breve.',
  },
  premiumCard: {
    title: 'Premium',
    intro: 'O que vem com o Premium:',
    moreTeams: 'Mais times (5 e 6)',
    logo: 'O logo da sua organização',
    records: 'Registro de amistosos e jogadores',
    attendance: 'Controle de presença',
    signUps: 'Inscrições por link',
  },
  preferences: {
    teamsSection: 'Personalização dos times',
    templateSection: 'Modelo para WhatsApp',
    title: 'Preferências',
    description:
      'Ficam salvas neste dispositivo e são usadas quando você monta times com a sessão iniciada.',
    playersPerTeam: { label: 'Jogadores por time', any: 'Qualquer' },
    teamCount: { label: 'Quantidade de times' },
    teams: {
      iconLabel: (team) => `${team}: ícone`,
      colorLabel: (team) => `${team}: cor`,
    },
    template: {
      header: 'Cabeçalho da mensagem',
      headerPlaceholder: 'Por exemplo: Amistoso de quinta às 21h',
      footer: 'Rodapé da mensagem',
      footerPlaceholder: 'Por exemplo: Confirmem presença',
      numbering: 'Numeração',
      numberingDot: '1. Nome',
      numberingParen: '1) Nome',
      numberingDash: '1- Nome',
      numberingNone: 'Sem números',
    },
    preview: { title: 'Prévia' },
    save: 'Salvar',
    saved: 'Salvo',
    restore: 'Restaurar padrões',
  },
  footer: {
    tagline: 'Sorteador tático de times para futebol entre amigos',
    developedBy: 'Desenvolvido por',
    rights: 'Todos os direitos reservados.',
  },
  landing: {
    eyebrow: 'Utilitário esportivo de montagem rápida',
    hero: {
      title: 'Monte os times da partida em segundos',
      subtitle:
        'Cole a lista do grupo do WhatsApp e o Kora limpa os nomes, sorteia dois times equilibrados e deixa a mensagem pronta para enviar.',
      cta: 'Amistoso rápido',
    },
    benefits: {
      title: 'Por que o Kora',
      noAccount: {
        title: 'Sem conta, sem instalar nada',
        text: 'Abra a página, cole a lista e pronto. Funciona no celular.',
      },
      anyList: {
        title: 'Entende qualquer lista',
        text: 'Números, marcadores, emojis e negrito: o Kora fica só com os nomes.',
      },
      fairDraw: {
        title: 'Sorteio justo, com goleiros separados',
        text: 'Times do mesmo tamanho e os goleiros em lados opostos.',
      },
    },
    steps: {
      title: 'Como funciona',
      paste: { title: 'Cole a lista', text: 'Copie do grupo do WhatsApp do jeito que está.' },
      check: {
        title: 'Confira os nomes',
        text: 'Corrija um nome, remova alguém ou marque os goleiros.',
      },
      draw: {
        title: 'Sorteie e copie',
        text: 'Sorteie de novo quantas vezes quiser e copie o texto para o grupo.',
      },
    },
  },
  tool: {
    progressLabel: 'Progresso do sorteio',
    stepDone: 'concluído',
    steps: { list: 'Lista', review: 'Revisão', teams: 'Times' },
    stepHeader: {
      paste: {
        title: 'Cole a lista de jogadores',
        subtitle:
          'Cole o texto do WhatsApp ou das suas notas e o Kora limpa os nomes e detecta os goleiros.',
      },
      preview: {
        title: 'Confira os nomes',
        subtitle: 'Confira os nomes e os goleiros detectados e escolha quantos times sortear.',
      },
      result: {
        title: 'Edite os times',
        subtitle: 'Troque jogadores, coloque quem ficou de fora e confirme os times.',
      },
      confirmed: {
        title: 'Times confirmados',
        subtitle: 'Copie a mensagem para o seu grupo ou crie a imagem para compartilhar.',
      },
    },
    teamTitle: (n) => `Time ${n}`,
    paste: {
      reviewSignIn: 'Entre para revisar a lista e editar os times.',
      detected: (n) => (n === 1 ? '1 jogador detectado' : `${n} jogadores detectados`),
      guide: {
        title: 'Guia de carga rápida',
        tag: 'Passo a passo',
        step1Title: 'Cole a lista como veio',
        step1:
          'Copie a mensagem do WhatsApp, do Telegram ou das suas notas. Um nome por linha ou separados por vírgula.',
        step2Title: 'Limpeza automática',
        step2:
          'Números, marcadores e hifens do início são removidos, e um nome repetido conta uma vez só. Observações entre parênteses e emojis são mantidos.',
        step3Title: 'Como marcar goleiros',
        step3Before: 'Escreva',
        step3Words: ['(goleiro)', '(goleira)', '(gk)'],
        step3After:
          'ao lado do nome ou adicione o emoji de luva 🧤. Eles são distribuídos de forma equilibrada entre os times.',
      },
      title: 'Entrada da lista // Área de transferência',
      clear: 'Limpar',
      label: 'Lista do WhatsApp',
      placeholder: 'Cole aqui a lista do seu grupo do WhatsApp',
      continue: 'Continuar',
    },
    preview: {
      settings: 'Ajustes da partida',
      settingsTag: 'Distribuição',
      listTitle: 'Jogadores detectados',
      listSubtitle: (n) => `Total processado: ${n} na lista ativa`,
      teamsTile: 'Times',
      perTeam: 'Por time',
      goalkeepers: 'Goleiros',
      evenTeams: 'Parelhos',
      unevenTeams: 'Desiguais',
      onePerTeam: '1 por time 🧤',
      readyDetail: (n) => `${n} jogadores prontos para um sorteio equilibrado`,
      status: {
        ok: 'Pronto para sortear',
        tooFew: (missing, min) =>
          missing === 1
            ? `Falta 1 jogador para chegar a ${min}.`
            : `Faltam ${missing} jogadores para chegar a ${min}.`,
        tooMany: (extra, max) =>
          extra === 1
            ? `Sobra 1 jogador: o máximo é ${max}.`
            : `Sobram ${extra} jogadores: o máximo é ${max}.`,
        uneven: (count, teams) =>
          teams === 2
            ? `São ${count} jogadores e o número precisa ser par.`
            : `São ${count} jogadores e com ${teams} times o número precisa ser múltiplo de ${teams}.`,
      },
      back: 'Voltar',
      backToList: 'Voltar à lista colada',
      draw: 'Sortear',
      drawTeams: 'Sortear times',
      continue: 'Continuar',
      goalkeeper: 'Goleiro',
      nameLabel: 'Nome do jogador',
      edit: (name) => `Editar ${name}`,
      remove: (name) => `Remover ${name}`,
      markGoalkeeper: (name) => `Marcar ${name} como goleiro`,
      unmarkGoalkeeper: (name) => `Desmarcar ${name} como goleiro`,
      sizeNotice: (perTeam, teams, count) =>
        teams === 2
          ? `Você costuma jogar ${perTeam} contra ${perTeam}, mas esta lista tem ${count === 1 ? '1 jogador' : `${count} jogadores`}.`
          : `Você costuma jogar com ${perTeam} por time: ${teams} times precisam de ${perTeam * teams} jogadores, mas esta lista tem ${count}.`,
      teamsLabel: 'Quantidade de times a sortear',
      teamsSignIn: 'Entre para usar 3 e 4 times.',
      teamsPremium: '5 e 6 times chegam com o Premium, em breve.',
      manualSignIn: 'Entre para montar os times à mão.',
    },
    result: {
      balanced: (n) => `${n} times equilibrados`,
      imageHint: 'Exporte uma imagem em formato vertical 9:16 para Instagram ou WhatsApp',
      title: 'Times',
      copy: 'Copiar texto',
      copied: 'Copiado',
      copyFailed: 'Não foi possível copiar. Selecione o texto e copie manualmente.',
      redraw: 'Sortear de novo',
      startOver: 'Começar de novo',
      swapHint:
        'Toque em um jogador e depois em um de outro time para trocá-los. Você também pode arrastá-los.',
      selected: (name) => `Selecionado: ${name}. Toque em um jogador de outro time.`,
      swapped: (a, b) => `${a} e ${b} trocados.`,
      manualHint:
        'Toque em um jogador e depois em outro para trocá-los, em uma vaga livre para movê-lo até lá, ou em «Sem time» para tirá-lo do time. Você também pode arrastá-los.',
      selectedManual: (name) =>
        `Selecionado: ${name}. Toque em outro jogador, em uma vaga livre ou em «Sem time».`,
      moved: (name, team) => `${name} foi para ${team}.`,
      leftTeam: (name) => `${name} ficou sem time.`,
      remainingDrawn: 'Os jogadores que faltavam foram sorteados.',
      teamsCleared: 'Todos os jogadores ficaram sem time.',
      poolTitle: 'Sem time',
      poolHint: 'Toque ou arraste aqui um jogador para tirá-lo do time.',
      poolDrop: (name) => `Tirar ${name} do time`,
      drawRemaining: 'Sortear os que faltam',
      clearTeams: 'Tirar todos',
      freeSlot: 'Vaga livre',
      moveHere: (name, team) => `Mover ${name} para ${team}`,
      complete: 'Times completos',
      confirm: 'Confirmar',
      confirmed: 'Times confirmados.',
      missing: (count) =>
        count === 1
          ? 'Falta 1 jogador para colocar em um time.'
          : `Faltam ${count} jogadores para colocar em um time.`,
      createImage: 'Criar imagem',
      imageSignIn: 'Entre para criar a imagem.',
      imageTitle: 'Imagem para stories',
      imageAlt: 'Imagem com os times, pronta para compartilhar',
      download: 'Baixar',
      share: 'Compartilhar',
      closeImage: 'Fechar',
      imageFailed: 'Não foi possível criar a imagem. Tente de novo.',
      shareFailed: 'Não foi possível compartilhar. Tente baixá-la.',
    },
  },
};
