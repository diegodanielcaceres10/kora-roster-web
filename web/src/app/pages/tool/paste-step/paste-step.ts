import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { checkPlayerCount } from '../../../core/draw-teams';
import { parsePastedNames } from '../../../core/parse-players';
import { I18n } from '../../../i18n/i18n';
import { Entitlements, LockReason } from '../../../plans/entitlements';
import { LockNotice } from '../../../plans/lock-notice';
import { FriendlyStore } from '../../../state/friendly.store';
import { UiBadge, UiButton, UiCard, UiIcon, UiTextarea } from '../../../ui';
import { countStatus } from '../count-status';

@Component({
  selector: 'app-paste-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LockNotice, UiBadge, UiButton, UiCard, UiTextarea, UiIcon],
  templateUrl: './paste-step.html',
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
