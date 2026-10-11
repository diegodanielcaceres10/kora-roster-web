import type { Dictionary } from './en';

export const es: Dictionary = {
  language: {
    label: 'Idioma',
  },
  meta: {
    landing: {
      title: 'Kora Roster – Arma los equipos del partido en segundos',
      description:
        'Pega la lista del grupo de WhatsApp y obtén dos equipos sorteados y parejos, con los arqueros repartidos, listos para enviar.',
    },
    tool: {
      title: 'Amistoso rápido – Kora Roster',
      description:
        'Pega la lista, revisa los nombres, sortea dos equipos y copia el mensaje para tu grupo de WhatsApp.',
    },
  },
  tool: {
    heading: 'Amistoso rápido',
    teamTitle: (n) => `Equipo ${n}`,
    paste: {
      title: 'Pega la lista',
      label: 'Lista de WhatsApp',
      placeholder: 'Pega aquí la lista de tu grupo de WhatsApp',
      hint: 'Un nombre por línea o separados por comas. Los números, viñetas y emojis no molestan.',
      continue: 'Continuar',
    },
    preview: {
      title: 'Revisa los nombres',
      count: (n) => (n === 1 ? '1 jugador' : `${n} jugadores`),
      status: {
        ok: 'Listo para sortear',
        tooFew: (missing) =>
          missing === 1
            ? 'Falta 1 jugador para llegar a 10.'
            : `Faltan ${missing} jugadores para llegar a 10.`,
        tooMany: (extra) =>
          extra === 1
            ? 'Sobra 1 jugador: el máximo es 22.'
            : `Sobran ${extra} jugadores: el máximo es 22.`,
        odd: (count) => `Son ${count} jugadores y tiene que ser un número par.`,
      },
      back: 'Volver',
      draw: 'Sortear',
      goalkeeper: 'Arquero',
      nameLabel: 'Nombre del jugador',
      edit: (name) => `Editar a ${name}`,
      remove: (name) => `Quitar a ${name}`,
      markGoalkeeper: (name) => `Marcar a ${name} como arquero`,
      unmarkGoalkeeper: (name) => `Quitar a ${name} como arquero`,
    },
    result: {
      title: 'Equipos',
      whatsappTitle: 'Texto para WhatsApp',
      copy: 'Copiar texto',
      copied: 'Copiado',
      copyFailed: 'No se pudo copiar. Selecciona el texto y cópialo a mano.',
      redraw: 'Volver a sortear',
      startOver: 'Empezar de nuevo',
    },
  },
};
