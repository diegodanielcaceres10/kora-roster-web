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
        tooFew: (missing: number) =>
          missing === 1
            ? '1 more player needed to reach 10.'
            : `${missing} more players needed to reach 10.`,
        tooMany: (extra: number) =>
          extra === 1
            ? '1 player too many: the maximum is 22.'
            : `${extra} players too many: the maximum is 22.`,
        odd: (count: number) => `${count} players: the number has to be even.`,
      },
      back: 'Back',
      draw: 'Draw teams',
      goalkeeper: 'Goalkeeper',
      nameLabel: 'Player name',
      edit: (name: string) => `Edit ${name}`,
      remove: (name: string) => `Remove ${name}`,
      markGoalkeeper: (name: string) => `Mark ${name} as goalkeeper`,
      unmarkGoalkeeper: (name: string) => `Unmark ${name} as goalkeeper`,
    },
    result: {
      title: 'Teams',
      whatsappTitle: 'Text for WhatsApp',
      copy: 'Copy text',
      copied: 'Copied',
      copyFailed: 'Could not copy. Select the text and copy it by hand.',
      redraw: 'Draw again',
      startOver: 'Start over',
    },
  },
};

export type Dictionary = typeof en;
