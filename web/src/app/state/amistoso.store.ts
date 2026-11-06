import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { checkPlayerCount, drawTeams, MAX_TEAMS, MIN_TEAMS } from '../core/draw-teams';
import { DEFAULT_TEAM_ICONS, formatTeamsForWhatsApp } from '../core/format-teams';
import { parsePastedNames } from '../core/parse-players';
import { I18n } from '../i18n/i18n';
import { Entitlements } from '../plans/entitlements';
import { DEFAULT_PREFERENCES } from '../preferences/preferences';
import { PreferencesService } from '../preferences/preferences-service';

export interface Player {
  id: string;
  name: string;
  isGoalkeeper: boolean;
}

export type Step = 'paste' | 'preview' | 'result';

interface AmistosoState {
  rawText: string;
  // The text the current list was read from, so going back and forward keeps the edits.
  parsedText: string | null;
  players: Player[];
  teams: Player[][] | null;
  // What the person picked in the selector, or null while they have not picked anything.
  teamCountChoice: number | null;
  step: Step;
  nextId: number;
}

// Goalkeepers go first in a team, and everybody else keeps their order.
const keepersFirst = (team: Player[]): Player[] => [
  ...team.filter((p) => p.isGoalkeeper),
  ...team.filter((p) => !p.isGoalkeeper),
];

const initialState: AmistosoState = {
  rawText: '',
  parsedText: null,
  players: [],
  teams: null,
  teamCountChoice: null,
  step: 'paste',
  nextId: 1,
};

export const AmistosoStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ players, teams, teamCountChoice }) => {
    const i18n = inject(I18n);
    const preferences = inject(PreferencesService);
    const entitlements = inject(Entitlements);

    // What the person picked, or else what they prefer, and never more teams than the plan
    // allows, so signing out brings it back to 2.
    const teamCount = computed(() =>
      Math.max(
        MIN_TEAMS,
        Math.min(
          teamCountChoice() ?? preferences.active()?.teamCount ?? MIN_TEAMS,
          entitlements.maxTeams(),
        ),
      ),
    );
    const playerCount = computed(() => players().length);
    const countError = computed(() => checkPlayerCount(playerCount(), teamCount()));
    // The icons and colors of the person who is signed in, or the defaults for everybody else.
    // The preferences always hold the six teams, with six different icons.
    const teamIcons = computed(
      () => preferences.active()?.teams.map((team) => team.icon) ?? DEFAULT_TEAM_ICONS,
    );
    const teamColors = computed(() =>
      (preferences.active() ?? DEFAULT_PREFERENCES).teams.map((team) => team.color),
    );

    return {
      teamCount,
      playerCount,
      countError,
      teamIcons,
      teamColors,
      canDraw: computed(() => countError() === null),
      // Set when the person usually plays a team size and this list is not that many
      // players for the teams in use. It is only a notice: it never stops the draw.
      sizeMismatch: computed(() => {
        const perTeam = preferences.active()?.playersPerTeam;
        const teams = teamCount();
        const count = playerCount();
        return perTeam && count !== perTeam * teams ? { perTeam, teams, count } : null;
      }),
      whatsappText: computed(() => {
        const current = teams();
        if (!current) return '';
        const { teamTitle } = i18n.t().tool;
        const icons = teamIcons();
        const styles = current.map((_, i) => ({ icon: icons[i], title: teamTitle(i + 1) }));
        const prefs = preferences.active();
        return formatTeamsForWhatsApp(
          current,
          styles,
          prefs ? { header: prefs.header, footer: prefs.footer, numbering: prefs.numbering } : {},
        );
      }),
    };
  }),
  withMethods((store) => {
    const entitlements = inject(Entitlements);

    return {
      setRawText(rawText: string): void {
        patchState(store, { rawText });
      },

      setTeamCount(count: number): void {
        const valid = Number.isInteger(count) && count >= MIN_TEAMS && count <= MAX_TEAMS;
        if (!valid || entitlements.teamsLock(count) !== null) return;
        patchState(store, { teamCountChoice: count });
      },

      continueToPreview(): void {
        const text = store.rawText();
        if (text === store.parsedText() && store.players().length > 0) {
          patchState(store, { step: 'preview', teams: null });
          return;
        }
        const parsed = parsePastedNames(text);
        if (parsed.length === 0) return;
        const first = store.nextId();
        patchState(store, {
          players: parsed.map((player, i) => ({ id: `p${first + i}`, ...player })),
          parsedText: text,
          nextId: first + parsed.length,
          teams: null,
          step: 'preview',
        });
      },

      back(): void {
        patchState(store, { step: 'paste' });
      },

      renamePlayer(id: string, name: string): void {
        const trimmed = name.trim();
        if (!trimmed) return;
        patchState(store, ({ players }) => ({
          players: players.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
        }));
      },

      removePlayer(id: string): void {
        patchState(store, ({ players }) => ({ players: players.filter((p) => p.id !== id) }));
      },

      toggleGoalkeeper(id: string): void {
        patchState(store, ({ players }) => ({
          players: players.map((p) => (p.id === id ? { ...p, isGoalkeeper: !p.isGoalkeeper } : p)),
        }));
      },

      draw(random: () => number = Math.random): void {
        const result = drawTeams(store.players(), random, store.teamCount());
        if (result.ok) patchState(store, { teams: result.teams, step: 'result' });
      },

      // Two players of different teams change places: the one who comes takes the place of
      // the one who goes, so every team keeps its size. Anything else is ignored.
      swapPlayers(idA: string, idB: string): void {
        const teams = store.teams();
        if (!teams) return;
        const teamA = teams.findIndex((team) => team.some((p) => p.id === idA));
        const teamB = teams.findIndex((team) => team.some((p) => p.id === idB));
        if (teamA < 0 || teamB < 0 || teamA === teamB) return;
        const a = teams[teamA].find((p) => p.id === idA) as Player;
        const b = teams[teamB].find((p) => p.id === idB) as Player;
        const replace = (team: Player[], out: Player, into: Player) =>
          keepersFirst(team.map((p) => (p.id === out.id ? into : p)));
        patchState(store, {
          teams: teams.map((team, i) =>
            i === teamA ? replace(team, a, b) : i === teamB ? replace(team, b, a) : team,
          ),
        });
      },

      reset(): void {
        patchState(store, initialState);
      },
    };
  }),
);
