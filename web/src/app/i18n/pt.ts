import type { Dictionary } from './en';

export const pt: Dictionary = {
  language: {
    label: 'Idioma',
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
  landing: {
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
    heading: 'Amistoso rápido',
    teamTitle: (n) => `Time ${n}`,
    paste: {
      title: 'Cole a lista',
      label: 'Lista do WhatsApp',
      placeholder: 'Cole aqui a lista do seu grupo do WhatsApp',
      hint: 'Um nome por linha ou separados por vírgula. Números, marcadores e emojis não atrapalham.',
      continue: 'Continuar',
    },
    preview: {
      title: 'Confira os nomes',
      count: (n) => (n === 1 ? '1 jogador' : `${n} jogadores`),
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
      draw: 'Sortear',
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
      teamsLabel: 'Times',
      teamsSignIn: 'Entre para usar 3 e 4 times.',
      teamsPremium: '5 e 6 times chegam com o Premium, em breve.',
    },
    result: {
      title: 'Times',
      whatsappTitle: 'Texto para o WhatsApp',
      copy: 'Copiar texto',
      copied: 'Copiado',
      copyFailed: 'Não foi possível copiar. Selecione o texto e copie manualmente.',
      redraw: 'Sortear de novo',
      startOver: 'Começar de novo',
    },
  },
};
