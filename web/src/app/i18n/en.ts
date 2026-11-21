export const en = {
  language: {
    label: 'Language',
  },
  theme: {
    toDark: 'Switch to dark mode',
    toLight: 'Switch to light mode',
  },
  meta: {
    landing: {
      title: 'Kora Roster – Build match teams in seconds',
      description:
        'Paste your WhatsApp group list and get two fair, randomized teams with the goalkeepers split, ready to send.',
    },
    tool: {
      title: 'Quick match – Kora Roster',
      description:
        'Paste the list, check the names, draw two teams and copy the message for your WhatsApp group.',
    },
    account: {
      title: 'My account – Kora Roster',
      description: 'Sign in with Google and manage your Kora Roster preferences.',
    },
  },
  account: {
    eyebrow: 'Organizer profile',
    title: 'My account',
    signInLink: 'Sign in',
    signInPrompt: 'Sign in with your Google account to save your preferences on this device.',
    unavailable: 'Signing in is not available yet.',
    scriptError: 'Could not load Google sign-in. Check your connection and try again.',
    invalidToken: 'The sign-in could not be verified. Try again.',
    signOut: 'Sign out',
    nameLabel: 'Name',
    emailLabel: 'Email',
  },
  locks: {
    signInLink: 'Sign in',
    premiumLabel: 'Premium',
    premiumSoon: 'Available with Premium, coming soon.',
  },
  premiumCard: {
    title: 'Premium',
    intro: 'What comes with Premium:',
    moreTeams: 'More teams (5 and 6)',
    logo: 'The logo of your organization',
    records: 'Record of friendlies and players',
    attendance: 'Attendance control',
    signUps: 'Sign-ups by link',
  },
  preferences: {
    teamsSection: 'Team customization',
    templateSection: 'WhatsApp template',
    title: 'Preferences',
    description: 'They are saved on this device and used when you build teams while signed in.',
    playersPerTeam: { label: 'Players per team', any: 'Any' },
    teamCount: { label: 'Number of teams' },
    teams: {
      iconLabel: (team: string) => `${team}: icon`,
      colorLabel: (team: string) => `${team}: color`,
    },
    template: {
      header: 'Message header',
      headerPlaceholder: 'For example: Friendly on Thursday at 9 pm',
      footer: 'Message footer',
      footerPlaceholder: 'For example: Please confirm your attendance',
      numbering: 'Numbering',
      numberingDot: '1. Name',
      numberingParen: '1) Name',
      numberingDash: '1- Name',
      numberingNone: 'No numbers',
    },
    preview: { title: 'Preview' },
    save: 'Save',
    saved: 'Saved',
    restore: 'Restore defaults',
  },
  footer: {
    tagline: 'Tactical team picker for friendly football',
    developedBy: 'Developed by',
    rights: 'All rights reserved.',
  },
  landing: {
    eyebrow: 'Quick team-building sports utility',
    hero: {
      title: 'Build the match teams in seconds',
      subtitle:
        'Paste your WhatsApp group list and Kora cleans up the names, splits two even teams and gives you a message ready to send.',
      cta: 'Quick match',
    },
    benefits: {
      title: 'Why Kora',
      noAccount: {
        title: 'No account, nothing to install',
        text: 'Open the page, paste the list, done. Works on your phone.',
      },
      anyList: {
        title: 'Understands any list',
        text: 'Numbers, bullets, emojis and bold text: Kora keeps only the names.',
      },
      fairDraw: {
        title: 'Fair draw, goalkeepers split',
        text: 'Teams of equal size, with the goalkeepers on opposite sides.',
      },
    },
    steps: {
      title: 'How it works',
      paste: { title: 'Paste the list', text: 'Copy it from your WhatsApp group as it is.' },
      check: {
        title: 'Check the names',
        text: 'Fix a name, remove someone or mark the goalkeepers.',
      },
      draw: {
        title: 'Draw and copy',
        text: 'Redraw as many times as you like, then copy the text for the group.',
      },
    },
  },
  tool: {
    progressLabel: 'Draw progress',
    stepDone: 'completed',
    steps: { list: 'List', review: 'Review', teams: 'Teams' },
    stepHeader: {
      paste: {
        title: 'Paste the player list',
        subtitle:
          'Paste the text from WhatsApp or your notes and Kora cleans up the names and spots the goalkeepers.',
      },
      preview: {
        title: 'Check the names',
        subtitle:
          'Check the names and the goalkeepers spotted, and choose how many teams to draw.',
      },
      result: {
        title: 'Edit the teams',
        subtitle: 'Swap players, place the ones left out and confirm the teams.',
      },
      confirmed: {
        title: 'Teams confirmed',
        subtitle: 'Copy the message for your group or create the image to share.',
      },
    },
    teamTitle: (n: number) => `Team ${n}`,
    paste: {
      reviewSignIn: 'Sign in to review the list and edit the teams.',
      detected: (n: number) => (n === 1 ? '1 player detected' : `${n} players detected`),
      guide: {
        title: 'Quick loading guide',
        tag: 'Step by step',
        step1Title: 'Paste the list as it is',
        step1:
          'Copy the message from WhatsApp, Telegram or your notes. One name per line, or separated by commas.',
        step2Title: 'Automatic cleanup',
        step2:
          'Numbers, bullets and dashes at the start are removed, and a repeated name counts once. Notes in brackets and emojis are kept.',
        step3Title: 'How to mark goalkeepers',
        step3Before: 'Write',
        step3Words: ['(goalkeeper)', '(goalie)', '(gk)'],
        step3After: 'next to the name, or add the glove emoji 🧤. They are spread evenly across the teams.',
      },
      title: 'List input // Clipboard',
      clear: 'Clear',
      label: 'WhatsApp list',
      placeholder: 'Paste the list from your WhatsApp group here',
      continue: 'Continue',
    },
    preview: {
      settings: 'Match settings',
      settingsTag: 'Distribution',
      listTitle: 'Players found',
      listSubtitle: (n: number) => `Total processed: ${n} in the active list`,
      teamsTile: 'Teams',
      perTeam: 'Per team',
      goalkeepers: 'Goalkeepers',
      evenTeams: 'Even',
      unevenTeams: 'Uneven',
      onePerTeam: '1 per team 🧤',
      readyDetail: (n: number) => `${n} players ready for a balanced draw`,
      status: {
        ok: 'Ready to draw',
        tooFew: (missing: number, min: number) =>
          missing === 1
            ? `1 more player needed to reach ${min}.`
            : `${missing} more players needed to reach ${min}.`,
        tooMany: (extra: number, max: number) =>
          extra === 1
            ? `1 player too many: the maximum is ${max}.`
            : `${extra} players too many: the maximum is ${max}.`,
        uneven: (count: number, teams: number) =>
          teams === 2
            ? `${count} players: the number has to be even.`
            : `${count} players: with ${teams} teams the number has to be a multiple of ${teams}.`,
      },
      back: 'Back',
      backToList: 'Back to the pasted list',
      draw: 'Draw teams',
      drawTeams: 'Draw teams',
      continue: 'Continue',
      goalkeeper: 'Goalkeeper',
      nameLabel: 'Player name',
      edit: (name: string) => `Edit ${name}`,
      remove: (name: string) => `Remove ${name}`,
      markGoalkeeper: (name: string) => `Mark ${name} as goalkeeper`,
      unmarkGoalkeeper: (name: string) => `Unmark ${name} as goalkeeper`,
      sizeNotice: (perTeam: number, teams: number, count: number) =>
        teams === 2
          ? `You usually play ${perTeam} vs ${perTeam}, but this list has ${count === 1 ? '1 player' : `${count} players`}.`
          : `You usually play with ${perTeam} per team: ${teams} teams need ${perTeam * teams} players, but this list has ${count}.`,
      teamsLabel: 'Number of teams to draw',
      teamsSignIn: 'Sign in to use 3 and 4 teams.',
      teamsPremium: '5 and 6 teams come with Premium, coming soon.',
      manualSignIn: 'Sign in to build the teams by hand.',
    },
    result: {
      imageHint: 'Export a vertical 9:16 image for Instagram or WhatsApp',
      copy: 'Copy for WhatsApp',
      copied: 'Copied',
      copyFailed: 'Could not copy. Select the text and copy it by hand.',
      redraw: 'Draw again',
      startOver: 'Start over',
      swapHint:
        'Tap a player, then a player from another team, to swap them. You can also drag them.',
      selected: (name: string) => `Selected: ${name}. Tap a player from another team.`,
      swapped: (a: string, b: string) => `${a} and ${b} swapped.`,
      manualHint:
        'Tap a player, then another player to swap them, a free spot to move them there, or "Without a team" to take them out of their team. You can also drag them.',
      selectedManual: (name: string) =>
        `Selected: ${name}. Tap another player, a free spot or "Without a team".`,
      moved: (name: string, team: string) => `${name} moved to ${team}.`,
      leftTeam: (name: string) => `${name} is now without a team.`,
      remainingDrawn: 'The remaining players were drawn.',
      teamsCleared: 'Everybody is now without a team.',
      poolTitle: 'Without a team',
      poolHint: 'Tap or drag a player here to take them out of their team.',
      poolDrop: (name: string) => `Take ${name} out of their team`,
      drawRemaining: 'Draw the rest',
      clearTeams: 'Remove everyone',
      freeSlot: 'Free spot',
      moveHere: (name: string, team: string) => `Move ${name} to ${team}`,
      complete: 'Teams complete',
      confirm: 'Confirm teams',
      confirmed: 'Teams confirmed.',
      missing: (count: number) =>
        count === 1 ? '1 player still needs a team.' : `${count} players still need a team.`,
      createImage: 'Image for stories',
      imageSignIn: 'Sign in to create the image.',
      imageTitle: 'Image for stories',
      imageAlt: 'Image with the teams, ready to share',
      download: 'Download',
      share: 'Share',
      closeImage: 'Close',
      imageFailed: 'The image could not be created. Try again.',
      shareFailed: 'It could not be shared. Try downloading it.',
      hintTitle: 'Tactical controls:',
      escKey: 'Esc',
      cancelSelection: 'Cancels the selection',
      quota: (n: number) => `Assigned quota: ${n} places`,
      playersOf: 'Players:',
      goalkeeperCount: (n: number) => (n === 1 ? '1 goalkeeper' : `${n} goalkeepers`),
      goalkeeperShort: 'GK',
      roleGoalkeeper: 'Starts in goal',
      roleField: 'Outfield player',
      freeSlotHint: 'Available to assign',
      placeHere: 'Place here',
      waiting: (n: number) => `${n} waiting`,
      placed: (placed: number, total: number) => `${placed}/${total} placed`,
      readyToPlace: 'Ready to assign',
      place: 'Place',
      placeAria: (name: string) => `Place ${name} in a team`,
      removeFromTeam: (name: string) => `Take ${name} out of the team`,
      toolsTitle: 'Distribution tools',
      redrawNote: 'Random',
      clearNote: 'Empty',
      confirmLocked: (missing: number) =>
        missing === 1
          ? 'It unlocks once every player has a team (1 missing).'
          : `It unlocks once every player has a team (${missing} missing).`,
      backToReview: 'Back to step 2 (review)',
      playersBadge: (n: number) => (n === 1 ? '1 player' : `${n} players`),
      statPlayers: 'Total players',
      statGoalkeepers: 'Goalkeepers',
    },
  },
};

export type Dictionary = typeof en;
