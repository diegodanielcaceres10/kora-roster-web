import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { checkPlayerCount, drawTeams } from '../core/draw-teams';
import { DEFAULT_TEAM_ICONS, formatTeamsForWhatsApp } from '../core/format-teams';
import { parsePastedNames } from '../core/parse-players';
import { I18n } from '../i18n/i18n';
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
  teams: [Player[], Player[]] | null;
  step: Step;
  nextId: number;
}

const initialState: AmistosoState = {
  rawText: '',
  parsedText: null,
  players: [],
  teams: null,
  step: 'paste',
  nextId: 1,
};

export const AmistosoStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ players, teams }) => {
    const i18n = inject(I18n);
    const preferences = inject(PreferencesService);
    const playerCount = computed(() => players().length);
    const countError = computed(() => checkPlayerCount(playerCount()));
    // The icons of the person who is signed in, or the default circles for everybody else.
    const teamIcons = computed(
      () => preferences.active()?.teams.map((team) => team.icon) ?? DEFAULT_TEAM_ICONS,
    );

    return {
      playerCount,
      countError,
      teamIcons,
      canDraw: computed(() => countError() === null),
      // Set when the person usually plays a team size and this list is not twice that.
      // It is only a notice: it never stops the draw.
      sizeMismatch: computed(() => {
        const perTeam = preferences.active()?.playersPerTeam;
        const count = playerCount();
        return perTeam && count !== perTeam * 2 ? { perTeam, count } : null;
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
  withMethods((store) => ({
    setRawText(rawText: string): void {
      patchState(store, { rawText });
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
      const result = drawTeams(store.players(), random);
      if (result.ok) patchState(store, { teams: result.teams, step: 'result' });
    },

    reset(): void {
      patchState(store, initialState);
    },
  })),
);
