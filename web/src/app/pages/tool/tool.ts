import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18n } from '../../i18n/i18n';
import { PageMeta } from '../../i18n/page-meta';
import { Entitlements } from '../../plans/entitlements';
import { FriendlyStore } from '../../state/friendly.store';
import { type StepHeaderStep, type StepState, UiStat, UiStepHeader } from '../../ui';
import { PasteStep } from './paste-step';
import { PreviewStep } from './preview-step';
import { ResultStep } from './result-step';

const ORDER = ['paste', 'preview', 'result'] as const;

@Component({
  selector: 'app-tool',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PasteStep, PreviewStep, ResultStep, UiStat, UiStepHeader],
  template: `
    <section class="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <ui-step-header
        [title]="header().title"
        [subtitle]="header().subtitle"
        [steps]="steps()"
        [stepsLabel]="i18n.t().tool.progressLabel"
        [doneLabel]="i18n.t().tool.stepDone"
        [accentLast]="isConfirmed()"
      >
        @if (isConfirmed()) {
          <div header-aside class="grid grid-cols-2 gap-2">
            <ui-stat [label]="i18n.t().tool.result.statPlayers" [value]="String(totalPlayers())" />
            <ui-stat
              [label]="i18n.t().tool.result.statGoalkeepers"
              [value]="String(goalkeepers())"
              valueTone="primary"
            />
          </div>
        }
      </ui-step-header>

      <!-- Active Step Container with discrete entrance animation -->
      <div class="animate-fade-in">
        @switch (store.step()) {
          @case ('paste') {
            <app-paste-step />
          }
          @case ('preview') {
            <app-preview-step />
          }
          @case ('result') {
            <app-result-step />
          }
        }
      </div>
    </section>
  `,
})
export class Tool {
  protected readonly i18n = inject(I18n);
  protected readonly store = inject(FriendlyStore);
  private readonly entitlements = inject(Entitlements);

  // The title and its explanation belong to the step in use. With the teams confirmed the
  // person is past the steps, so the page says what is left to do with them.
  protected readonly isConfirmed = computed(
    () => this.store.step() === 'result' && this.store.confirmed(),
  );
  protected readonly header = computed(() => {
    const { stepHeader } = this.i18n.t().tool;
    return this.isConfirmed() ? stepHeader.confirmed : stepHeader[this.store.step()];
  });

  protected readonly totalPlayers = computed(() => this.store.players().length);
  protected readonly goalkeepers = computed(
    () => this.store.players().filter((player) => player.isGoalkeeper).length,
  );
  protected readonly String = String;

  // The steps are for people who can go through them, which takes an account, and only until the
  // teams are confirmed: after that there is nothing left to follow.
  protected readonly steps = computed<StepHeaderStep[]>(() => {
    if (this.entitlements.reviewLock() !== null || this.isConfirmed()) return [];
    const { steps } = this.i18n.t().tool;
    const labels = [steps.list, steps.review, steps.teams];
    return ORDER.map((key, index) => ({ label: labels[index], state: this.stateOf(key) }));
  });

  constructor() {
    inject(PageMeta).apply('tool');
  }

  private stateOf(key: (typeof ORDER)[number]): StepState {
    const current = ORDER.indexOf(this.store.step());
    const index = ORDER.indexOf(key);
    if (index === current) return 'current';
    return index < current ? 'done' : 'todo';
  }
}
