import type { Dictionary } from './en';

export const es: Dictionary = {
  language: {
    label: 'Idioma',
  },
  theme: {
    toDark: 'Cambiar a modo oscuro',
    toLight: 'Cambiar a modo claro',
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
    subtitle:
      'Gestiona tu cuenta y personaliza cómo se ven tus equipos y el mensaje para tu grupo de WhatsApp.',
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
    playersPerTeam: {
      label: 'Jugadores por equipo',
      any: 'Libre',
      selected: (label) => `${label} seleccionado`,
    },
    teamCount: { label: 'Cantidad de equipos', default: (n) => `${n} por defecto` },
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
    save: 'Guardar preferencias',
    saved: 'Guardado',
    restore: 'Restaurar valores',
  },
  footer: {
    tagline: 'Sorteador táctico de equipos para fútbol entre amigos',
    developedBy: 'Desarrollado por',
    rights: 'Todos los derechos reservados.',
    portfolio: 'Portfolio',
    newTab: 'se abre en una pestaña nueva',
  },
  landing: {
    hero: {
      title: 'Arma los equipos del partido',
      accent: 'en segundos',
      subtitle:
        'Pega la lista del grupo de WhatsApp y Kora limpia los nombres, detecta a los arqueros, sortea equipos parejos y te deja el mensaje listo para enviar.',
      cta: 'Amistoso rápido',
      demo: 'Ver demostración',
      checks: [
        'Empieza gratis sin cuenta',
        'Más opciones con tu cuenta',
        'Arqueros repartidos entre los equipos',
      ],
    },
    demo: {
      input: 'Entrada de WhatsApp',
      clipboard: 'Portapapeles pegado',
      draw: 'Sortear',
      result: 'Alineación resultante',
      cta: 'Probar con tu lista',
    },
    steps: {
      eyebrow: 'Cómo funciona',
      title: 'De WhatsApp a la cancha en 3 pasos',
      subtitle: 'Sin planillas complejas ni discusiones interminables antes de atarte los botines.',
      paste: {
        title: 'Copia y pega la lista',
        text: 'Copia el mensaje tal cual viene del grupo de WhatsApp. Kora quita los números y las viñetas y detecta a los arqueros.',
      },
      balance: {
        title: 'Equilibrio táctico',
        text: 'Kora reparte a los arqueros entre los equipos y arma equipos del mismo tamaño.',
      },
      send: {
        title: 'Copia y envía al grupo',
        text: 'Con un solo clic tienes el mensaje con los equipos listo para pegar de vuelta en WhatsApp y confirmar el partido.',
      },
    },
    cta: {
      tag: 'Sin demoras en el vestuario',
      title: '¿Listo para el próximo partido?',
      text: 'Empieza a sortear en un instante. Sin registros ni descargas.',
    },
  },
  tool: {
    progressLabel: 'Progreso del sorteo',
    stepDone: 'completado',
    steps: { list: 'Lista', review: 'Revisión', teams: 'Equipos' },
    stepHeader: {
      paste: {
        title: 'Pega la lista de jugadores',
        subtitle:
          'Pega el texto desde WhatsApp o tus notas y Kora limpia los nombres y detecta a los arqueros.',
      },
      preview: {
        title: 'Revisa los nombres',
        subtitle: 'Verifica los nombres y los arqueros detectados y elige cuántos equipos sortear.',
      },
      result: {
        title: 'Edita los equipos',
        subtitle: 'Intercambia jugadores, ubica a los que faltan y confirma los equipos.',
      },
      confirmed: {
        title: 'Equipos confirmados',
        subtitle: 'Copia el mensaje para tu grupo o crea la imagen para compartir.',
      },
    },
    teamTitle: (n) => `Equipo ${n}`,
    paste: {
      reviewSignIn: 'Inicia sesión para revisar la lista y editar los equipos.',
      detected: (n) => (n === 1 ? '1 jugador detectado' : `${n} jugadores detectados`),
      guide: {
        title: 'Guía de carga rápida',
        tag: 'Paso a paso',
        step1Title: 'Pega la lista tal cual',
        step1:
          'Copia el mensaje desde WhatsApp, Telegram o tus notas. Un nombre por línea o separados por comas.',
        step2Title: 'Limpieza automática',
        step2:
          'Se quitan solos los números, viñetas y guiones del inicio, y un nombre repetido cuenta una sola vez. Las aclaraciones y los emojis se conservan.',
        step3Title: 'Cómo marcar arqueros',
        step3Before: 'Escribe',
        step3Words: ['(arquero)', '(portero)', '(gk)'],
        step3After: 'junto al nombre o añade el emoji 🧤. Se reparten parejos entre los equipos.',
      },
      title: 'Entrada de lista // Portapapeles',
      clear: 'Limpiar',
      label: 'Lista de WhatsApp',
      placeholder: 'Pega aquí la lista de tu grupo de WhatsApp',
      continue: 'Continuar',
    },
    preview: {
      settings: 'Ajustes del partido',
      settingsTag: 'Distribución',
      listTitle: 'Jugadores detectados',
      listSubtitle: (n) => `Total procesado: ${n} en lista activa`,
      teamsTile: 'Equipos',
      perTeam: 'Por equipo',
      goalkeepers: 'Arqueros',
      evenTeams: 'Parejos',
      unevenTeams: 'Desparejos',
      onePerTeam: '1 por equipo 🧤',
      readyDetail: (n) => `${n} jugadores listos para un sorteo equilibrado`,
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
      backToList: 'Volver a la lista anterior',
      draw: 'Sortear',
      drawTeams: 'Sortear equipos',
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
      teamsLabel: 'Cantidad de equipos a sortear',
      teamsSignIn: 'Inicia sesión para usar 3 y 4 equipos.',
      teamsPremium: '5 y 6 equipos llegan con Premium, próximamente.',
      manualSignIn: 'Inicia sesión para armar los equipos a mano.',
    },
    result: {
      imageHint: 'Exporta una imagen con formato vertical 9:16 para Instagram o WhatsApp',
      copy: 'Copiar para WhatsApp',
      copied: 'Copiado',
      copyFailed: 'No se pudo copiar. Selecciona el texto y cópialo a mano.',
      redraw: 'Volver a sortear',
      startOver: 'Empezar de nuevo',
      swapHint:
        'Toca un jugador y después uno de otro equipo para intercambiarlos. También puedes arrastrarlos.',
      selected: (name) => `Seleccionado: ${name}. Toca un jugador de otro equipo.`,
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
      confirm: 'Confirmar equipos',
      confirmed: 'Equipos confirmados.',
      missing: (count) =>
        count === 1 ? 'Falta 1 jugador por ubicar.' : `Faltan ${count} jugadores por ubicar.`,
      createImage: 'Imagen para stories',
      imageSignIn: 'Inicia sesión para crear la imagen.',
      imageTitle: 'Imagen para stories',
      imageAlt: 'Imagen con los equipos, lista para compartir',
      download: 'Descargar',
      share: 'Compartir',
      closeImage: 'Cerrar',
      imageFailed: 'No se pudo crear la imagen. Prueba de nuevo.',
      shareFailed: 'No se pudo compartir. Prueba a descargarla.',
      hintTitle: 'Interacción táctica:',
      escKey: 'Esc',
      cancelSelection: 'Cancela la selección',
      quota: (n) => `Cupo asignado: ${n} plazas`,
      playersOf: 'Jugadores:',
      goalkeeperCount: (n) => (n === 1 ? '1 arquero' : `${n} arqueros`),
      goalkeeperShort: 'ARQ',
      roleGoalkeeper: 'Titular en el arco',
      roleField: 'Jugador de campo',
      freeSlotHint: 'Disponible para asignación',
      placeHere: 'Ubicar aquí',
      waiting: (n) => `${n} en espera`,
      placed: (placed, total) => `${placed}/${total} ubicados`,
      readyToPlace: 'Listo para asignar',
      place: 'Ubicar',
      placeAria: (name) => `Ubicar a ${name} en un equipo`,
      removeFromTeam: (name) => `Sacar a ${name} del equipo`,
      toolsTitle: 'Herramientas de distribución',
      redrawNote: 'Aleatorio',
      clearNote: 'Vaciar',
      confirmLocked: (missing) =>
        missing === 1
          ? 'Se habilitará al ubicar a todos los jugadores (falta 1).'
          : `Se habilitará al ubicar a todos los jugadores (faltan ${missing}).`,
      backToReview: 'Volver al paso 2 (revisión)',
      playersBadge: (n) => (n === 1 ? '1 jugador' : `${n} jugadores`),
      statPlayers: 'Total de jugadores',
      statGoalkeepers: 'Arqueros',
      storyConfirmed: 'confirmado',
      storyBrand: 'Generado con Kora Roster',
    },
  },
};
