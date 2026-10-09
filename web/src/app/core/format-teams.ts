export interface TeamStyle {
  icon: string;
  title: string;
}

export const DEFAULT_TEAM_ICONS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];

const GLOVE = '🧤';

export function formatTeamsForWhatsApp(
  teams: readonly (readonly { name: string; isGoalkeeper: boolean }[])[],
  styles: readonly TeamStyle[],
): string {
  if (styles.length < teams.length) {
    throw new RangeError(
      `Got ${teams.length} teams but only ${styles.length} icon and title pairs`,
    );
  }

  return teams
    .map((team, index) => {
      const { icon, title } = styles[index];
      const lines = team.map(
        (player, i) => `${i + 1}. ${player.name}${player.isGoalkeeper ? ` ${GLOVE}` : ''}`,
      );
      return [`${icon} ${title}`, ...lines].join('\n');
    })
    .join('\n\n');
}
