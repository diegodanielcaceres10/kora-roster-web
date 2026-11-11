import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import {
  checkPlayerCount,
  completeTeams,
  drawTeams,
  keepersFirst,
  MAX_TEAMS,
  MIN_TEAMS,
} from '../core/draw-teams';
import { DEFAULT_TEAM_ICONS, formatTeamsForWhatsApp } from '../core/format-teams';
import { parsePastedNames } from '../core/parse-players';
import { StoryInput } from '../core/story-layout';
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
  // The players who have no team yet, while the teams are being built by hand.
  pool: Player[];
  // The teams are final: they can be shared and no longer changed.
  confirmed: boolean;
  // What the person picked in the selector, or null while they have not picked anything.
  teamCountChoice: number | null;
  step: Step;
  nextId: number;
}

const initialState: AmistosoState = {
  rawText: '',
  parsedText: null,
  players: [],
  teams: null,
  pool: [],
  confirmed: false,
  teamCountChoice: null,
  step: 'paste',
  nextId: 1,
};

export const AmistosoStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ players, teams, pool, teamCountChoice }) => {
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
    const canDraw = computed(() => countError() === null);
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
      canDraw,
      // How many players each team has, once the list is valid for the teams in use.
      teamSize: computed(() => (canDraw() ? playerCount() / teamCount() : null)),
      // Everybody has a team. A team never takes more players than its size, so with nobody
      // left without a team every team is full.
      isComplete: computed(() => teams() !== null && pool().length === 0),
      // Set when the person usually plays a team size and this list is not that many
      // players for the teams in use. It is only a notice: it never stops the draw.
      sizeMismatch: computed(() => {
        const perTeam = preferences.active()?.playersPerTeam;
        const teams = teamCount();
        const count = playerCount();
        return perTeam && count !== perTeam * teams ? { perTeam, teams, count } : null;
      }),
      // What the story image is made from: only names, goalkeepers, titles and colors.
      storyInput: computed((): StoryInput | null => {
        const current = teams();
        if (!current) return null;
        const { teamTitle } = i18n.t().tool;
        const colors = teamColors();
        const prefs = preferences.active();
        return {
          teams: current.map((team, i) => ({
            title: teamTitle(i + 1),
            color: colors[i],
            players: team.map((p) => ({ name: p.name, isGoalkeeper: p.isGoalkeeper })),
          })),
          header: prefs?.header ?? '',
          footer: prefs?.footer ?? '',
          numbering: prefs?.numbering ?? 'dot',
        };
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

    // The teams followed by the players without a team, which count as one more place.
    const groupsOf = (teams: Player[][], pool: Player[]): Player[][] => [...teams, pool];
    const place = (groups: Player[][]): void =>
      patchState(store, { teams: groups.slice(0, -1), pool: groups[groups.length - 1] });

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
          patchState(store, { step: 'preview', teams: null, pool: [], confirmed: false });
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
          pool: [],
          confirmed: false,
          step: 'preview',
        });
      },

      // One step back: from the confirmed teams to editing them, from the teams to the list, and
      // from the list to the pasted text. The teams are left behind when going back to the
      // list, because it can change before they are drawn again.
      back(): void {
        if (store.step() === 'result') {
          if (store.confirmed()) patchState(store, { confirmed: false });
          else patchState(store, { step: 'preview', teams: null, pool: [], confirmed: false });
          return;
        }
        patchState(store, { step: 'paste' });
      },

      // The teams are final, so they can be shared. Only possible once everybody has a team.
      confirm(): void {
        if (store.isComplete()) patchState(store, { confirmed: true });
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
        if (result.ok) {
          patchState(store, { teams: result.teams, pool: [], confirmed: false, step: 'result' });
        }
      },

      // Opens the teams empty, with everybody waiting without a team, to build them by hand.
      startManual(): void {
        if (entitlements.manualLock() !== null || !store.canDraw()) return;
        patchState(store, {
          teams: Array.from({ length: store.teamCount() }, (): Player[] => []),
          pool: keepersFirst(store.players()),
          confirmed: false,
          step: 'result',
        });
      },

      // A player goes to a team that has room, or to the players without a team. Anything
      // else is ignored, so every team keeps at most its size.
      movePlayer(id: string, to: number | 'pool'): void {
        const teams = store.teams();
        const size = store.teamSize();
        if (!teams || size === null) return;
        if (to !== 'pool' && !(Number.isInteger(to) && to >= 0 && to < teams.length)) return;
        const groups = groupsOf(teams, store.pool());
        const target = to === 'pool' ? teams.length : to;
        const from = groups.findIndex((group) => group.some((p) => p.id === id));
        if (from < 0 || from === target) return;
        if (target < teams.length && groups[target].length >= size) return;
        const player = groups[from].find((p) => p.id === id) as Player;
        place(
          groups.map((group, i) =>
            i === from
              ? group.filter((p) => p.id !== id)
              : i === target
                ? keepersFirst([...group, player])
                : group,
          ),
        );
      },

      // Deals everybody who has no team into the places that are free, as a draw would.
      drawRemaining(random: () => number = Math.random): void {
        const teams = store.teams();
        const size = store.teamSize();
        if (!teams || size === null || store.pool().length === 0) return;
        patchState(store, { teams: completeTeams(teams, store.pool(), size, random), pool: [] });
      },

      // Takes everybody out of their team, to build them again from scratch.
      clearTeams(): void {
        const teams = store.teams();
        if (!teams) return;
        patchState(store, {
          teams: teams.map((): Player[] => []),
          pool: keepersFirst(store.players()),
        });
      },

      // Two players who are not in the same place change places: the one who comes takes the
      // place of the one who goes, so every team keeps its size. The players without a team
      // count as one more place. Anything else is ignored.
      swapPlayers(idA: string, idB: string): void {
        const teams = store.teams();
        if (!teams) return;
        const groups = groupsOf(teams, store.pool());
        const groupA = groups.findIndex((group) => group.some((p) => p.id === idA));
        const groupB = groups.findIndex((group) => group.some((p) => p.id === idB));
        if (groupA < 0 || groupB < 0 || groupA === groupB) return;
        const a = groups[groupA].find((p) => p.id === idA) as Player;
        const b = groups[groupB].find((p) => p.id === idB) as Player;
        const replace = (group: Player[], out: Player, into: Player) =>
          keepersFirst(group.map((p) => (p.id === out.id ? into : p)));
        place(
          groups.map((group, i) =>
            i === groupA ? replace(group, a, b) : i === groupB ? replace(group, b, a) : group,
          ),
        );
      },

      reset(): void {
        patchState(store, initialState);
      },
    };
  }),
);
