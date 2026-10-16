export interface TeamStyle {
  icon: string;
  title: string;
}

export type Numbering = 'dot' | 'paren' | 'dash' | 'none';

export interface FormatOptions {
  header?: string;
  footer?: string;
  numbering?: Numbering;
}

export const DEFAULT_TEAM_ICONS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];

const GLOVE = '🧤';

const NUMBER_FORMATS: Record<Numbering, (n: number) => string> = {
  dot: (n) => `${n}. `,
  paren: (n) => `${n}) `,
  dash: (n) => `${n}- `,
  none: () => '',
};

export function formatTeamsForWhatsApp(
  teams: readonly (readonly { name: string; isGoalkeeper: boolean }[])[],
  styles: readonly TeamStyle[],
  options: FormatOptions = {},
): string {
  if (styles.length < teams.length) {
    throw new RangeError(
      `Got ${teams.length} teams but only ${styles.length} icon and title pairs`,
    );
  }

  const numbered = NUMBER_FORMATS[options.numbering ?? 'dot'];
  const body = teams
    .map((team, index) => {
      const { icon, title } = styles[index];
      const lines = team.map(
        (player, i) => `${numbered(i + 1)}${player.name}${player.isGoalkeeper ? ` ${GLOVE}` : ''}`,
      );
      return [`${icon} ${title}`, ...lines].join('\n');
    })
    .join('\n\n');

  return [options.header?.trim(), body, options.footer?.trim()].filter((part) => part).join('\n\n');
}
