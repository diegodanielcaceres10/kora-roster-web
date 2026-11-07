import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { I18n } from '../../i18n/i18n';
import { STORY_DELIVERY, storyFileName } from '../../image/story-delivery';
import { STORY_BLOB } from '../../image/story-image';
import { Entitlements, LockReason } from '../../plans/entitlements';
import { LockNotice } from '../../plans/lock-notice';
import { AmistosoStore } from '../../state/amistoso.store';
import { ToastService, UiButton } from '../../ui';

interface MadeImage {
  url: string;
  blob: Blob;
  name: string;
  canShare: boolean;
  // The teams the image was made from, so it is dropped as soon as they change.
  teams: unknown;
}

// Makes the story image of the drawn teams and lets the person download or share it.
@Component({
  selector: 'app-story-image-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LockNotice, UiButton],
  template: `
    <div class="space-y-3">
      <ui-button variant="outline" size="lg" [disabled]="busy()" (click)="create()">
        <i
          class="fa-solid"
          [class.fa-lock]="locked()"
          [class.fa-image]="!locked()"
          aria-hidden="true"
        ></i>
        {{ t().createImage }}
      </ui-button>
      <app-lock-notice [reason]="notice()?.reason ?? null" [message]="notice()?.message ?? null" />

      @if (image(); as made) {
        <div class="space-y-3 rounded-xl border border-secondary/15 p-3">
          <h3>{{ t().imageTitle }}</h3>
          <img
            [src]="made.url"
            [alt]="t().imageAlt"
            class="mx-auto max-h-[70vh] w-auto rounded-lg"
          />
          <div class="flex flex-wrap gap-3">
            <ui-button (click)="download()">
              <i class="fa-solid fa-download" aria-hidden="true"></i>
              {{ t().download }}
            </ui-button>
            @if (made.canShare) {
              <ui-button variant="outline" (click)="share()">
                <i class="fa-solid fa-share-nodes" aria-hidden="true"></i>
                {{ t().share }}
              </ui-button>
            }
            <ui-button variant="ghost" (click)="close()">{{ t().closeImage }}</ui-button>
          </div>
        </div>
      }
    </div>
  `,
})
export class StoryImagePanel {
  private readonly store = inject(AmistosoStore);
  private readonly entitlements = inject(Entitlements);
  private readonly i18n = inject(I18n);
  private readonly toast = inject(ToastService);
  private readonly createBlob = inject(STORY_BLOB);
  private readonly delivery = inject(STORY_DELIVERY);

  protected readonly t = computed(() => this.i18n.t().tool.result);
  protected readonly locked = computed(() => this.entitlements.storyImageLock() !== null);
  protected readonly busy = signal(false);
  protected readonly notice = signal<{ reason: LockReason; message: string } | null>(null);

  private readonly made = signal<MadeImage | null>(null);
  protected readonly image = this.made.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.forget());
    // An image that no longer matches the teams is of no use: drop it. Effects of a component
    // run before its template is drawn, so a stale image is never shown.
    effect(() => {
      const made = this.made();
      if (made && made.teams !== this.store.teams()) untracked(() => this.forget());
    });
  }

  protected async create(): Promise<void> {
    const lock = this.entitlements.storyImageLock();
    if (lock) {
      this.notice.set({ reason: lock, message: this.t().imageSignIn });
      return;
    }
    const input = this.store.storyInput();
    if (!input || this.busy()) return;
    const teams = this.store.teams();
    this.busy.set(true);
    this.notice.set(null);
    try {
      const blob = await this.createBlob(input);
      this.forget();
      const name = storyFileName(new Date());
      this.made.set({
        url: URL.createObjectURL(blob),
        blob,
        name,
        canShare: this.delivery.canShare(blob, name),
        teams,
      });
    } catch {
      this.toast.show(this.t().imageFailed, 4000);
    } finally {
      this.busy.set(false);
    }
  }

  protected download(): void {
    const made = this.image();
    if (made) this.delivery.download(made.url, made.name);
  }

  protected async share(): Promise<void> {
    const made = this.image();
    if (!made) return;
    try {
      await this.delivery.share(made.blob, made.name);
    } catch {
      this.toast.show(this.t().shareFailed, 4000);
    }
  }

  protected close(): void {
    this.forget();
  }

  private forget(): void {
    const made = this.made();
    if (made) URL.revokeObjectURL(made.url);
    this.made.set(null);
  }
}
