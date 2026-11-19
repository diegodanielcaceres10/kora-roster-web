import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18n } from '../../i18n/i18n';
import { PageMeta } from '../../i18n/page-meta';
import { Entitlements } from '../../plans/entitlements';
import { FriendlyStore } from '../../state/friendly.store';
import { type StepHeaderStep, type StepState, UiStepHeader } from '../../ui';
import { PasteStep } from './paste-step';
import { PreviewStep } from './preview-step';
import { ResultStep } from './result-step';

const ORDER = ['paste', 'preview', 'result'] as const;

@Component({
  selector: 'app-tool',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PasteStep, PreviewStep, ResultStep, UiStepHeader],
  template: `
    <section class="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <ui-step-header
        [title]="header().title"
        [subtitle]="header().subtitle"
        [steps]="steps()"
        [stepsLabel]="i18n.t().tool.progressLabel"
        [doneLabel]="i18n.t().tool.stepDone"
      />

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
  protected readonly header = computed(() => {
    const { stepHeader } = this.i18n.t().tool;
    const step = this.store.step();
    if (step === 'result' && this.store.confirmed()) return stepHeader.confirmed;
    return stepHeader[step];
  });

  // The steps are for people who can go through them, which takes an account. Without one the
  // list can only be drawn straight to the final result, so there is nothing to follow.
  protected readonly steps = computed<StepHeaderStep[]>(() => {
    if (this.entitlements.reviewLock() !== null) return [];
    const { steps } = this.i18n.t().tool;
    const labels = [steps.list, steps.review, steps.teams];
    return ORDER.map((key, index) => ({ label: labels[index], state: this.stateOf(key) }));
  });

  constructor() {
    inject(PageMeta).apply('tool');
  }

  private stateOf(key: (typeof ORDER)[number]): StepState {
    // With the teams confirmed there is nothing left to do, so the last step is done as well.
    if (this.store.confirmed()) return 'done';
    const current = ORDER.indexOf(this.store.step());
    const index = ORDER.indexOf(key);
    if (index === current) return 'current';
    return index < current ? 'done' : 'todo';
  }
}
