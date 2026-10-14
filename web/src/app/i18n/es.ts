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
    account: {
      title: 'Mi cuenta – Kora Roster',
      description: 'Inicia sesión con Google y gestiona tus preferencias de Kora Roster.',
    },
  },
  account: {
    title: 'Mi cuenta',
    signInLink: 'Iniciar sesión',
    signInPrompt:
      'Inicia sesión con tu cuenta de Google para guardar tus preferencias en este dispositivo.',
    unavailable: 'El inicio de sesión todavía no está disponible.',
    scriptError:
      'No se pudo cargar el inicio de sesión de Google. Revisa tu conexión e inténtalo de nuevo.',
    invalidToken: 'No se pudo verificar el inicio de sesión. Inténtalo de nuevo.',
    signOut: 'Cerrar sesión',
    nameLabel: 'Nombre',
    emailLabel: 'Correo',
  },
  landing: {
    hero: {
      title: 'Arma los equipos del partido en segundos',
      subtitle:
        'Pega la lista del grupo de WhatsApp y Kora limpia los nombres, sortea dos equipos parejos y te deja el mensaje listo para enviar.',
      cta: 'Amistoso rápido',
    },
    benefits: {
      title: 'Por qué Kora',
      noAccount: {
        title: 'Sin cuenta, sin instalar nada',
        text: 'Abres la página, pegas la lista y listo. Funciona en el móvil.',
      },
      anyList: {
        title: 'Entiende cualquier lista',
        text: 'Números, viñetas, emojis y negritas: Kora se queda solo con los nombres.',
      },
      fairDraw: {
        title: 'Sorteo justo, con arqueros repartidos',
        text: 'Equipos del mismo tamaño y los arqueros en lados opuestos.',
      },
    },
    steps: {
      title: 'Cómo funciona',
      paste: { title: 'Pega la lista', text: 'Cópiala del grupo de WhatsApp tal como está.' },
      check: {
        title: 'Revisa los nombres',
        text: 'Corrige uno, quita a alguien o marca a los arqueros.',
      },
      draw: {
        title: 'Sortea y copia',
        text: 'Vuelve a sortear cuantas veces quieras y copia el texto para el grupo.',
      },
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
