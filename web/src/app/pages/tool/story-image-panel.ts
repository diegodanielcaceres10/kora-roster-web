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
import { ToastService, UiButton, UiCard } from '../../ui';

interface MadeImage {
  url: string;
  blob: Blob;
  name: string;
  canShare: boolean;
  teams: unknown;
}

@Component({
  selector: 'app-story-image-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LockNotice, UiButton, UiCard],
  template: `
    <div class="space-y-4">
      <div class="flex flex-wrap items-center gap-3 rounded-xl border border-secondary/10 bg-white p-4 shadow-xs">
        <ng-content />
        <ui-button variant="outline" [disabled]="busy()" (click)="create()">
          <i
            class="fa-solid"
            [class.fa-lock]="locked()"
            [class.fa-image]="!locked()"
            aria-hidden="true"
          ></i>
          {{ t().createImage }}
        </ui-button>
      </div>
      <p class="text-xs text-secondary/60">Exportá una imagen con formato vertical 9:16 para Instagram o WhatsApp</p>
      <app-lock-notice [reason]="notice()?.reason ?? null" [message]="notice()?.message ?? null" />

      @if (image(); as made) {
        <ui-card accent="alternative">
          <div card-header class="flex items-center justify-between border-b border-secondary/10 pb-3">
            <h3 class="flex items-center gap-2 text-base font-bold text-secondary">
              <i class="fa-solid fa-mobile-screen-button text-alternative" aria-hidden="true"></i>
              {{ t().imageTitle }}
            </h3>
            <ui-button variant="ghost" (click)="close()">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
              {{ t().closeImage }}
            </ui-button>
          </div>

          <div class="space-y-4 pt-2">
            <div class="overflow-hidden rounded-xl bg-slate-900 p-2 shadow-inner">
              <img
                [src]="made.url"
                [alt]="t().imageAlt"
                class="mx-auto max-h-[65vh] w-auto rounded-lg shadow-md"
              />
            </div>
            <div class="flex flex-wrap items-center gap-3">
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
        </ui-card>
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
