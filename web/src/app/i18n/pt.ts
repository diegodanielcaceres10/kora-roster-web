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
        tooFew: (missing) =>
          missing === 1
            ? 'Falta 1 jogador para chegar a 10.'
            : `Faltam ${missing} jogadores para chegar a 10.`,
        tooMany: (extra) =>
          extra === 1
            ? 'Sobra 1 jogador: o máximo é 22.'
            : `Sobram ${extra} jogadores: o máximo é 22.`,
        odd: (count) => `São ${count} jogadores e o número precisa ser par.`,
      },
      back: 'Voltar',
      draw: 'Sortear',
      goalkeeper: 'Goleiro',
      nameLabel: 'Nome do jogador',
      edit: (name) => `Editar ${name}`,
      remove: (name) => `Remover ${name}`,
      markGoalkeeper: (name) => `Marcar ${name} como goleiro`,
      unmarkGoalkeeper: (name) => `Desmarcar ${name} como goleiro`,
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
