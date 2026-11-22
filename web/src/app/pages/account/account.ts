import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Auth } from '../../auth/auth';
import { UserAvatar } from '../../auth/user-avatar';
import { I18n } from '../../i18n/i18n';
import { PageMeta } from '../../i18n/page-meta';
import { UiButton, UiIcon } from '../../ui';
import { PreferencesEditor } from './preferences-editor';
import { PremiumCard } from './premium-card';

@Component({
  selector: 'app-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButton, UserAvatar, PreferencesEditor, PremiumCard, UiIcon],
  template: `
    <section class="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <header class="space-y-2">
        <h1 class="text-3xl font-black uppercase tracking-tight text-ink sm:text-5xl">
          {{ t().title }}
        </h1>
        <p class="max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
          {{ t().subtitle }}
        </p>
      </header>

      @if (!auth.enabled) {
        <div class="space-y-2 rounded-2xl border border-line bg-surface p-6 text-center shadow-xs">
          <p class="text-ink-muted">{{ t().unavailable }}</p>
        </div>
      } @else if (auth.user(); as user) {
        <!-- Profile -->
        <div
          data-profile
          class="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div class="flex items-center gap-4">
            <span class="relative inline-flex">
              <app-user-avatar [user]="user" [size]="64" />
              <span
                data-online
                aria-hidden="true"
                class="absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-surface bg-alternative"
              ></span>
            </span>
            <dl class="min-w-0 space-y-1">
              <div>
                <dt class="sr-only">{{ t().nameLabel }}</dt>
                <dd>
                  <h2 class="font-display text-xl font-black tracking-tight text-ink">
                    {{ user.name }}
                  </h2>
                </dd>
              </div>
              <div>
                <dt class="sr-only">{{ t().emailLabel }}</dt>
                <dd class="flex items-center gap-1.5 break-all text-sm text-ink-muted">
                  <ui-icon name="at" class="shrink-0 text-ink-faint" />
                  {{ user.email }}
                </dd>
              </div>
            </dl>
          </div>

          <div class="sm:shrink-0">
            <ui-button variant="outline" (click)="signOut()">
              <ui-icon name="logout" />
              {{ t().signOut }}
            </ui-button>
          </div>
        </div>

        <!-- Premium teaser -->
        <app-premium-card />

        <!-- Preferences -->
        <app-preferences-editor />
      } @else {
        <!-- Signed out -->
        <div
          class="mx-auto max-w-md space-y-5 rounded-2xl border border-line bg-surface p-6 text-center shadow-xs sm:p-8"
        >
          <div
            class="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-xl text-amber-700 dark:text-primary"
          >
            <ui-icon name="user" />
          </div>

          <p class="text-sm leading-relaxed text-ink-muted">{{ t().signInPrompt }}</p>

          <div class="flex justify-center pt-2">
            <div #googleButton data-google-button></div>
          </div>

          @if (problem(); as message) {
            <p
              role="alert"
              class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            >
              {{ message }}
            </p>
          }
        </div>
      }
    </section>
  `,
})
export class Account {
  protected readonly auth = inject(Auth);
  private readonly i18n = inject(I18n);

  protected readonly t = computed(() => this.i18n.t().account);
  private readonly googleButton = viewChild<ElementRef<HTMLElement>>('googleButton');
  private readonly scriptFailed = signal(false);

  protected readonly problem = computed(() => {
    if (this.auth.rejected()) return this.t().invalidToken;
    return this.scriptFailed() ? this.t().scriptError : null;
  });

  constructor() {
    inject(PageMeta).apply('account');
    effect(() => {
      const host = this.googleButton()?.nativeElement;
      if (host) untracked(() => void this.draw(host));
    });
  }

  protected signOut(): void {
    void this.auth.signOut();
  }

  private async draw(host: HTMLElement): Promise<void> {
    this.scriptFailed.set(false);
    try {
      await this.auth.renderButton(host);
    } catch {
      this.scriptFailed.set(true);
    }
  }
}
