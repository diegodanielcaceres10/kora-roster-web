import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18n } from '../../i18n/i18n';
import { PageMeta } from '../../i18n/page-meta';
import { Entitlements } from '../../plans/entitlements';
import { FriendlyStore } from '../../state/friendly.store';
import { PasteStep } from './paste-step';
import { PreviewStep } from './preview-step';
import { ResultStep } from './result-step';

interface StepDef {
  key: 'paste' | 'preview' | 'result';
  index: string;
  label: string;
}

@Component({
  selector: 'app-tool',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PasteStep, PreviewStep, ResultStep],
  template: `
    <section class="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:py-8">
      <!-- Header with minimal sports utility identity -->
      <div
        class="flex flex-col gap-3 border-b border-secondary/10 pb-5 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div
            class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary/60"
          >
            <span class="inline-block size-2 rounded-full bg-alternative"></span>
            <span>Matchday Tool</span>
            <span>•</span>
            <span>{{ i18n.t().tool.mode }}</span>
          </div>
          <h1 class="mt-1 text-2xl font-black tracking-tight text-secondary sm:text-3xl">
            {{ i18n.t().tool.heading }}
          </h1>
        </div>

        @if (showSteps()) {
          <!-- Sporty Stepper Indicator -->
          <nav [attr.aria-label]="i18n.t().tool.progressLabel" class="w-full sm:w-auto">
            <ol
              class="flex items-center gap-1 sm:gap-2 rounded-xl border border-secondary/15 bg-white p-1.5 shadow-xs"
            >
              @for (step of steps(); track step.key; let i = $index) {
                <li class="flex items-center">
                  <div
                    [class]="stepBadgeClass(step.key)"
                    class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all duration-150"
                  >
                    <span class="tabular-nums text-[11px]">{{ step.index }}</span>
                    <span class="hidden md:inline">{{ step.label }}</span>
                  </div>
                  @if (i < steps().length - 1) {
                    <i
                      class="fa-solid fa-chevron-right mx-1 text-[10px] text-secondary/30"
                      aria-hidden="true"
                    ></i>
                  }
                </li>
              }
            </ol>
          </nav>
        }
      </div>

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

  // The steps are for people who can go through them, which takes an account. Without one the
  // list can only be drawn straight to the final result, so there is nothing to follow.
  protected readonly showSteps = computed(() => this.entitlements.reviewLock() === null);

  protected readonly steps = computed<StepDef[]>(() => {
    const t = this.i18n.t().tool;
    return [
      { key: 'paste', index: '01', label: t.paste.title },
      { key: 'preview', index: '02', label: t.preview.title },
      { key: 'result', index: '03', label: t.result.title },
    ];
  });

  constructor() {
    inject(PageMeta).apply('tool');
  }

  protected stepBadgeClass(stepKey: 'paste' | 'preview' | 'result'): string {
    const current = this.store.step();
    const order = ['paste', 'preview', 'result'];
    const currentIndex = order.indexOf(current);
    const stepIndex = order.indexOf(stepKey);

    const done = 'bg-alternative/15 text-alternative font-semibold';

    // With the teams confirmed there is nothing left to do, so the last step is done as well.
    if (this.store.confirmed()) return done;
    if (current === stepKey) {
      return 'bg-secondary text-white shadow-xs';
    }
    if (stepIndex < currentIndex) {
      return done;
    }
    return 'text-secondary/50';
  }
}
