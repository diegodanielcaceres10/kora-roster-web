import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { checkPlayerCount, drawTeams } from '../core/draw-teams';
import { DEFAULT_TEAM_ICONS, formatTeamsForWhatsApp } from '../core/format-teams';
import { parsePastedNames } from '../core/parse-players';
import { I18n } from '../i18n/i18n';

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
    const playerCount = computed(() => players().length);
    const countError = computed(() => checkPlayerCount(playerCount()));

    return {
      playerCount,
      countError,
      canDraw: computed(() => countError() === null),
      whatsappText: computed(() => {
        const current = teams();
        if (!current) return '';
        const { teamTitle } = i18n.t().tool;
        const styles = current.map((_, i) => ({
          icon: DEFAULT_TEAM_ICONS[i],
          title: teamTitle(i + 1),
        }));
        return formatTeamsForWhatsApp(current, styles);
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
