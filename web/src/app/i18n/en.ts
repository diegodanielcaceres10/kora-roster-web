export const en = {
  language: {
    label: 'Language',
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
  landing: {
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
    heading: 'Quick match',
    teamTitle: (n: number) => `Team ${n}`,
    paste: {
      title: 'Paste the list',
      label: 'WhatsApp list',
      placeholder: 'Paste the list from your WhatsApp group here',
      hint: 'One name per line, or separated by commas. Numbers, bullets and emojis are fine.',
      continue: 'Continue',
    },
    preview: {
      title: 'Check the names',
      count: (n: number) => (n === 1 ? '1 player' : `${n} players`),
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
      draw: 'Draw teams',
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
      teamsLabel: 'Teams',
      teamsSignIn: 'Sign in to use 3 and 4 teams.',
      teamsPremium: '5 and 6 teams come with Premium, coming soon.',
    },
    result: {
      title: 'Teams',
      whatsappTitle: 'Text for WhatsApp',
      copy: 'Copy text',
      copied: 'Copied',
      copyFailed: 'Could not copy. Select the text and copy it by hand.',
      redraw: 'Draw again',
      startOver: 'Start over',
      swapHint:
        'Tap a player, then a player from another team, to swap them. You can also drag them.',
      selected: (name: string) => `Selected: ${name}. Tap a player from another team.`,
      swapped: (a: string, b: string) => `${a} and ${b} swapped.`,
    },
  },
};

export type Dictionary = typeof en;
