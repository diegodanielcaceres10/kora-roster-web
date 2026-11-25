import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { drawTeams, keepersFirst } from '../../core/draw-teams';
import { parsePastedNames } from '../../core/parse-players';
import { I18n } from '../../i18n/i18n';
import { PageMeta } from '../../i18n/page-meta';
import { UiButton, UiButtonLink, UiIcon } from '../../ui';

// What the demonstration pastes: numbered players, as the page names them, and the two ways of
// marking a goalkeeper. It uses list markers that every language understands.
const sampleOf = (name: (n: number) => string): string[] =>
  Array.from({ length: 10 }, (_, i) => {
    const n = i + 1;
    const mark = n === 1 ? ' 🧤' : n === 5 ? ' (gk)' : '';
    return `${n}. ${name(n)}${mark}`;
  });

// The demonstration is made with the same parser and the same draw as the tool, with a fixed
// "random" so that it always shows the same teams: it can never show what the app does not do.
const demoTeamsOf = (sample: string[]) => {
  const result = drawTeams(parsePastedNames(sample.join('\n')), () => 0.37, 2);
  return result.ok ? result.teams.map((team) => keepersFirst(team)) : [];
};

const STEP_ICONS = ['clipboard', 'adjustments-horizontal', 'send'] as const;

const CARD_TILE =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xl text-amber-700 dark:text-primary';

@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButton, UiButtonLink, UiIcon],
  host: { class: 'block' },
  templateUrl: './landing.html',
})
export class Landing {
  protected readonly i18n = inject(I18n);
  private readonly document = inject(DOCUMENT);

  protected readonly t = computed(() => this.i18n.t().landing);
  protected readonly toolLink = computed(() => ['/', this.i18n.lang(), 'friendly']);
  protected readonly sample = computed(() => sampleOf(this.i18n.t().tool.playerName));
  protected readonly teams = computed(() => demoTeamsOf(this.sample()));
  protected readonly tile = CARD_TILE;

  protected readonly steps = computed(() => {
    const { paste, balance, send } = this.t().steps;
    return [paste, balance, send].map((step, i) => ({ ...step, icon: STEP_ICONS[i] }));
  });

  constructor() {
    inject(PageMeta).apply('landing');
  }

  // Scrolls to the demonstration, without the animation for people who asked for less motion.
  protected showDemo(section: HTMLElement): void {
    const reduce = this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)');
    section.scrollIntoView({ behavior: reduce?.matches ? 'auto' : 'smooth', block: 'start' });
  }
}
