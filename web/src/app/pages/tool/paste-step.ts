import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { parsePastedNames } from '../../core/parse-players';
import { I18n } from '../../i18n/i18n';
import { FriendlyStore } from '../../state/friendly.store';
import { UiButton, UiCard, UiTextarea } from '../../ui';

@Component({
  selector: 'app-paste-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButton, UiCard, UiTextarea],
  template: `
    <section class="space-y-4">
      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <!-- Main Tactical Input Card -->
        <div class="lg:col-span-2">
          <ui-card accent="primary">
            <div card-header class="flex flex-wrap items-center justify-between gap-2 border-b border-secondary/10 pb-3">
              <h2>{{ t().paste.title }}</h2>
              @if (detectedCount(); as count) {
                <span
                  class="inline-flex items-center gap-1.5 rounded-full bg-secondary/8 px-3 py-1 text-xs font-bold text-secondary tabular-nums"
                >
                  <i class="fa-solid fa-users text-primary" aria-hidden="true"></i>
                  {{ t().paste.detected(count) }}
                </span>
              }
            </div>

            <div class="space-y-5 pt-1">
              <ui-textarea
                [label]="t().paste.label"
                [placeholder]="t().paste.placeholder"
                [hint]="t().paste.hint"
                [rows]="8"
                [value]="store.rawText()"
                (valueChange)="store.setRawText($event)"
              />

              <div class="flex items-center justify-end pt-2">
                <ui-button size="lg" [disabled]="!hasNames()" (click)="store.continueToPreview()">
                  <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                  {{ t().paste.continue }}
                </ui-button>
              </div>
            </div>
          </ui-card>
        </div>

        <!-- Sports Utility Guidance Sidebar -->
        <div class="space-y-4 lg:col-span-1">
          <div class="rounded-xl border border-secondary/15 bg-white p-5 shadow-xs">
            <h3 class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary/80">
              <i class="fa-solid fa-clipboard-check text-primary" aria-hidden="true"></i>
              {{ t().paste.guide.title }}
            </h3>
            <ul class="mt-4 space-y-3.5 text-xs text-secondary/80">
              <li class="flex items-start gap-2.5">
                <span class="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded bg-secondary/8 font-bold text-secondary">1</span>
                <span>{{ t().paste.guide.step1 }}</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded bg-secondary/8 font-bold text-secondary">2</span>
                <span>{{ t().paste.guide.step2 }}</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded bg-alternative/15 font-bold text-alternative">🧤</span>
                <span>{{ t().paste.guide.step3Before }} <strong class="text-secondary">{{ t().paste.guide.step3Word }}</strong> {{ t().paste.guide.step3After }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class PasteStep {
  protected readonly store = inject(FriendlyStore);
  private readonly i18n = inject(I18n);

  protected readonly t = computed(() => this.i18n.t().tool);
  protected readonly detectedCount = computed(() => parsePastedNames(this.store.rawText()).length);
  protected readonly hasNames = computed(() => this.detectedCount() > 0);
}
