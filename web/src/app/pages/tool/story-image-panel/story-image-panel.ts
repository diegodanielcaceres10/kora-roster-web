import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18n } from '../../../i18n/i18n';
import { STORY_DELIVERY, storyFileName } from '../../../image/story-delivery';
import { STORY_BLOB } from '../../../image/story-image';
import { Entitlements, LockReason } from '../../../plans/entitlements';
import { LockNotice } from '../../../plans/lock-notice';
import { FriendlyStore } from '../../../state/friendly.store';
import { Toast, UiButton, UiIcon } from '../../../ui';

// The browser starts a download as soon as the link is clicked, but it is given time to read the
// image before it is freed.
const FREE_AFTER_MS = 60_000;

let nextHint = 0;

// The actions of the confirmed teams that put the story image on the device: it is made when one
// of the buttons is pressed and goes straight to the download or to the sharing panel.
@Component({
  selector: 'app-story-image-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LockNotice, UiButton, UiIcon],
  templateUrl: './story-image-panel.html',
})
export class StoryImagePanel {
  protected readonly hintId = `story-image-hint-${nextHint++}`;
  private readonly store = inject(FriendlyStore);
  private readonly entitlements = inject(Entitlements);
  private readonly i18n = inject(I18n);
  private readonly toast = inject(Toast);
  private readonly createBlob = inject(STORY_BLOB);
  private readonly delivery = inject(STORY_DELIVERY);

  protected readonly t = computed(() => this.i18n.t().tool.result);
  protected readonly locked = computed(() => this.entitlements.storyImageLock() !== null);
  protected readonly busy = signal(false);
  protected readonly notice = signal<{ reason: LockReason; message: string } | null>(null);

  // The image is not made yet, so the browser is asked about a stand-in file of the same kind.
  protected readonly canShare = this.delivery.canShare(
    new Blob([], { type: 'image/png' }),
    'kora-roster.png',
  );

  protected async download(): Promise<void> {
    // The name carries the moment of the click, even if making the image takes a while.
    const name = storyFileName(new Date());
    const blob = await this.make();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    this.delivery.download(url, name);
    setTimeout(() => URL.revokeObjectURL(url), FREE_AFTER_MS);
  }

  protected async share(): Promise<void> {
    const name = storyFileName(new Date());
    const blob = await this.make();
    if (!blob) return;
    try {
      await this.delivery.share(blob, name);
    } catch {
      this.toast.show(this.t().shareFailed, 4000);
    }
  }

  // Makes the image of the teams as they are now, or says why it cannot: there is no account, or
  // the image could not be drawn. It returns nothing in both cases.
  private async make(): Promise<Blob | null> {
    const lock = this.entitlements.storyImageLock();
    if (lock) {
      this.notice.set({ reason: lock, message: this.t().imageSignIn });
      return null;
    }
    const input = this.store.storyInput();
    if (!input || this.busy()) return null;
    this.busy.set(true);
    this.notice.set(null);
    try {
      return await this.createBlob(input);
    } catch {
      this.toast.show(this.t().imageFailed, 4000);
      return null;
    } finally {
      this.busy.set(false);
    }
  }
}
