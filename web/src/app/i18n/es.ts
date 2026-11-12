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
    eyebrow: 'Perfil de Organizador',
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
  locks: {
    signInLink: 'Iniciar sesión',
    premiumLabel: 'Premium',
    premiumSoon: 'Disponible con Premium, próximamente.',
  },
  premiumCard: {
    title: 'Premium',
    intro: 'Lo que viene con Premium:',
    moreTeams: 'Más equipos (5 y 6)',
    logo: 'El logo de tu organización',
    records: 'Registro de amistosos y jugadores',
    attendance: 'Control de asistencias',
    signUps: 'Inscripciones por enlace',
  },
  preferences: {
    teamsSection: 'Personalización de equipos',
    templateSection: 'Plantilla para WhatsApp',
    title: 'Preferencias',
    description:
      'Se guardan en este dispositivo y se usan cuando armas equipos con la sesión iniciada.',
    playersPerTeam: { label: 'Jugadores por equipo', any: 'Cualquiera' },
    teamCount: { label: 'Cantidad de equipos' },
    teams: {
      iconLabel: (team) => `${team}: ícono`,
      colorLabel: (team) => `${team}: color`,
    },
    template: {
      header: 'Encabezado del mensaje',
      headerPlaceholder: 'Por ejemplo: Amistoso del jueves a las 21',
      footer: 'Pie del mensaje',
      footerPlaceholder: 'Por ejemplo: Confirmen asistencia',
      numbering: 'Numeración',
      numberingDot: '1. Nombre',
      numberingParen: '1) Nombre',
      numberingDash: '1- Nombre',
      numberingNone: 'Sin números',
    },
    preview: { title: 'Vista previa' },
    save: 'Guardar',
    saved: 'Guardado',
    restore: 'Restaurar valores',
  },
  footer: {
    tagline: 'Sorteador táctico de equipos para fútbol entre amigos',
  },
  landing: {
    eyebrow: 'Utilidad deportiva de armado rápido',
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
    mode: 'Modo Amistoso',
    progressLabel: 'Progreso del sorteo',
    heading: 'Amistoso rápido',
    teamTitle: (n) => `Equipo ${n}`,
    paste: {
      detected: (n) => (n === 1 ? '1 jugador detectado' : `${n} jugadores detectados`),
      guide: {
        title: 'Guía de carga rápida',
        step1: 'Copia y pega la lista tal cual sale de tu grupo de WhatsApp.',
        step2: 'Los números, viñetas, guiones y emojis se limpian de manera automática.',
        step3Before: 'Agrega el emoji de guante o la palabra',
        step3Word: '(arquero)',
        step3After: 'para repartir arqueros parejos.',
      },
      title: 'Pega la lista',
      label: 'Lista de WhatsApp',
      placeholder: 'Pega aquí la lista de tu grupo de WhatsApp',
      hint: 'Un nombre por línea o separados por comas. Los números, viñetas y emojis no molestan.',
      continue: 'Continuar',
    },
    preview: {
      settings: 'Configuración de partido',
      teamsCount: (n) => `${n} equipos`,
      perTeam: 'Por equipo',
      goalkeepers: 'Arqueros',
      editHint: 'Edita nombres o asigna arqueros',
      columnPlayer: '# Jugador',
      columnActions: 'Acciones',
      title: 'Revisa los nombres',
      count: (n) => (n === 1 ? '1 jugador' : `${n} jugadores`),
      status: {
        ok: 'Listo para sortear',
        tooFew: (missing, min) =>
          missing === 1
            ? `Falta 1 jugador para llegar a ${min}.`
            : `Faltan ${missing} jugadores para llegar a ${min}.`,
        tooMany: (extra, max) =>
          extra === 1
            ? `Sobra 1 jugador: el máximo es ${max}.`
            : `Sobran ${extra} jugadores: el máximo es ${max}.`,
        uneven: (count, teams) =>
          teams === 2
            ? `Son ${count} jugadores y tiene que ser un número par.`
            : `Son ${count} jugadores y con ${teams} equipos tiene que ser múltiplo de ${teams}.`,
      },
      back: 'Volver',
      draw: 'Sortear',
      continue: 'Continuar',
      goalkeeper: 'Arquero',
      nameLabel: 'Nombre del jugador',
      edit: (name) => `Editar a ${name}`,
      remove: (name) => `Quitar a ${name}`,
      markGoalkeeper: (name) => `Marcar a ${name} como arquero`,
      unmarkGoalkeeper: (name) => `Quitar a ${name} como arquero`,
      sizeNotice: (perTeam, teams, count) =>
        teams === 2
          ? `Sueles jugar ${perTeam} contra ${perTeam}, pero esta lista tiene ${count === 1 ? '1 jugador' : `${count} jugadores`}.`
          : `Sueles jugar con ${perTeam} por equipo: ${teams} equipos necesitan ${perTeam * teams} jugadores, pero esta lista tiene ${count}.`,
      teamsLabel: 'Equipos',
      teamsSignIn: 'Inicia sesión para usar 3 y 4 equipos.',
      teamsPremium: '5 y 6 equipos llegan con Premium, próximamente.',
      manualSignIn: 'Inicia sesión para armar los equipos a mano.',
    },
    result: {
      balanced: (n) => `${n} equipos equilibrados`,
      shareFormat: 'Formato listo para compartir',
      imageHint: 'Exporta una imagen con formato vertical 9:16 para Instagram o WhatsApp',
      title: 'Equipos',
      whatsappTitle: 'Texto para WhatsApp',
      copy: 'Copiar texto',
      copied: 'Copiado',
      copyFailed: 'No se pudo copiar. Selecciona el texto y cópialo a mano.',
      redraw: 'Volver a sortear',
      startOver: 'Empezar de nuevo',
      swapHint:
        'Tocá un jugador y después uno de otro equipo para intercambiarlos. También podés arrastrarlos.',
      selected: (name) => `Seleccionado: ${name}. Tocá un jugador de otro equipo.`,
      swapped: (a, b) => `${a} y ${b} intercambiados.`,
      manualHint:
        'Toca un jugador y luego otro para intercambiarlos, un lugar libre para moverlo allí, o «Sin equipo» para sacarlo de su equipo. También puedes arrastrarlos.',
      selectedManual: (name) =>
        `Seleccionado: ${name}. Toca otro jugador, un lugar libre o «Sin equipo».`,
      moved: (name, team) => `${name} pasó a ${team}.`,
      leftTeam: (name) => `${name} quedó sin equipo.`,
      remainingDrawn: 'Se sortearon los jugadores que faltaban.',
      teamsCleared: 'Todos los jugadores quedaron sin equipo.',
      poolTitle: 'Sin equipo',
      poolHint: 'Toca o arrastra aquí a un jugador para sacarlo de su equipo.',
      poolDrop: (name) => `Sacar a ${name} de su equipo`,
      drawRemaining: 'Sortear los que faltan',
      clearTeams: 'Sacar a todos',
      freeSlot: 'Lugar libre',
      moveHere: (name, team) => `Mover a ${name} a ${team}`,
      complete: 'Equipos completos',
      confirm: 'Confirmar',
      confirmed: 'Equipos confirmados.',
      missing: (count) =>
        count === 1 ? 'Falta 1 jugador por ubicar.' : `Faltan ${count} jugadores por ubicar.`,
      createImage: 'Crear imagen',
      imageSignIn: 'Inicia sesión para crear la imagen.',
      imageTitle: 'Imagen para historias',
      imageAlt: 'Imagen con los equipos, lista para compartir',
      download: 'Descargar',
      share: 'Compartir',
      closeImage: 'Cerrar',
      imageFailed: 'No se pudo crear la imagen. Probá de nuevo.',
      shareFailed: 'No se pudo compartir. Probá descargarla.',
    },
  },
};
