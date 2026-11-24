import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { checkPlayerCount } from '../../core/draw-teams';
import { parsePastedNames } from '../../core/parse-players';
import { I18n } from '../../i18n/i18n';
import { Entitlements, LockReason } from '../../plans/entitlements';
import { LockNotice } from '../../plans/lock-notice';
import { FriendlyStore } from '../../state/friendly.store';
import { UiBadge, UiButton, UiCard, UiIcon, UiTextarea } from '../../ui';
import { countStatus } from './count-status';

@Component({
  selector: 'app-paste-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LockNotice, UiBadge, UiButton, UiCard, UiTextarea, UiIcon],
  template: `
    <section class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <ui-card>
          <div card-header class="flex flex-wrap items-center gap-x-2 gap-y-2">
            <h2 class="mr-auto flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-ink">
              <ui-icon name="clipboard" class="text-amber-700 dark:text-primary" />
              {{ t().paste.title }}
            </h2>
            @if (detectedCount(); as count) {
              <ui-badge tone="primary" class="order-last basis-full sm:order-none sm:basis-auto">
                <ui-icon name="users" />
                {{ t().paste.detected(count) }}
              </ui-badge>
            }
            <ui-button size="sm" variant="outline" [disabled]="!rawText()" (click)="clear()">
              <ui-icon name="trash" />
              {{ t().paste.clear }}
            </ui-button>
          </div>

          <ui-textarea
            hideLabel
            [label]="t().paste.label"
            [placeholder]="t().paste.placeholder"
            [rows]="10"
            [value]="rawText()"
            (valueChange)="store.setRawText($event)"
          />

          <div card-footer class="space-y-2">
            @if (drawNote(); as note) {
              <p data-draw-note class="text-right text-xs text-ink-muted">{{ note }}</p>
            }
            <div class="flex flex-wrap items-center justify-between gap-3">
              <ui-button size="lg" variant="outline" [disabled]="!hasNames()" (click)="review()">
                <ui-icon [name]="reviewLocked() ? 'lock' : 'arrow-right'" />
                {{ t().paste.advanced }}
              </ui-button>
              <ui-button size="lg" [disabled]="!canDraw()" (click)="drawNow()">
                <ui-icon name="bolt" />
                {{ t().preview.draw }}
              </ui-button>
            </div>
            <div data-review-notice>
              <app-lock-notice
                [reason]="reviewNotice()?.reason ?? null"
                [message]="reviewNotice()?.message ?? null"
              />
            </div>
          </div>
        </ui-card>
      </div>

      <ui-card data-guide class="lg:col-span-1">
        <div card-header class="flex items-center justify-between gap-2">
          <h3 class="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-ink">
            <ui-icon name="book" class="text-amber-700 dark:text-primary" />
            {{ t().paste.guide.title }}
          </h3>
          <ui-badge>{{ t().paste.guide.tag }}</ui-badge>
        </div>
        <ol class="space-y-5">
          @for (step of guideSteps(); track step.number) {
            <li class="flex items-start gap-3">
              <span
                data-step-number
                class="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-mono text-sm font-bold text-amber-700 dark:text-primary"
              >
                {{ step.number }}
              </span>
              <div>
                <h4 class="font-display text-sm font-bold uppercase tracking-tight text-ink">
                  {{ step.title }}
                </h4>
                <p class="mt-1 text-sm text-ink-muted">
                  {{ step.before }}
                  @for (word of step.words; track word) {
                    <code class="rounded bg-ink/8 px-1.5 py-0.5 font-mono text-xs text-ink">{{ word }}</code>
                  }
                  {{ step.after }}
                </p>
              </div>
            </li>
          }
        </ol>
      </ui-card>
    </section>
  `,
})
export class PasteStep {
  protected readonly store = inject(FriendlyStore);
  private readonly i18n = inject(I18n);
  private readonly entitlements = inject(Entitlements);

  protected readonly t = computed(() => this.i18n.t().tool);
  protected readonly rawText = this.store.rawText;
  private readonly editor = viewChild.required(UiTextarea);

  // The guide as plain data: steps 1 and 2 are one text, step 3 has the goalkeeper words in the
  // middle, which are shown as keys.
  protected readonly guideSteps = computed(() => {
    const guide = this.t().paste.guide;
    return [
      { number: '01', title: guide.step1Title, before: guide.step1, words: [], after: '' },
      { number: '02', title: guide.step2Title, before: guide.step2, words: [], after: '' },
      {
        number: '03',
        title: guide.step3Title,
        before: guide.step3Before,
        words: guide.step3Words,
        after: guide.step3After,
      },
    ];
  });
  protected readonly detectedCount = computed(() => parsePastedNames(this.store.rawText()).length);
  protected readonly hasNames = computed(() => this.detectedCount() > 0);
  // Going on to review the list is for people with an account. Without one the list can only be
  // drawn right away, and it explains why when they try.
  protected readonly reviewLocked = computed(() => this.entitlements.reviewLock() !== null);
  protected readonly reviewNotice = signal<{ reason: LockReason; message: string } | null>(null);
  // The list can be drawn right away when it fits the teams, with no need to check it first.
  protected readonly canDraw = computed(
    () => checkPlayerCount(this.detectedCount(), this.store.teamCount()) === null,
  );
  protected readonly drawNote = computed(() =>
    this.hasNames() && !this.canDraw()
      ? countStatus(this.t().preview.status, this.detectedCount(), this.store.teamCount())
      : null,
  );

  protected clear(): void {
    this.store.setRawText('');
    this.editor().focus();
  }

  protected review(): void {
    const lock = this.entitlements.reviewLock();
    if (lock) {
      this.reviewNotice.set({ reason: lock, message: this.t().paste.reviewSignIn });
      return;
    }
    this.reviewNotice.set(null);
    this.store.continueToPreview();
  }

  // Draws and confirms in one go, so the person lands on the final result.
  protected drawNow(): void {
    this.store.continueToPreview();
    this.store.draw();
    this.store.confirm();
  }
}
