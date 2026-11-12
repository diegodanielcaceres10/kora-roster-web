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
import { UiButton } from '../../ui';
import { PreferencesEditor } from './preferences-editor';
import { PremiumCard } from './premium-card';

@Component({
  selector: 'app-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButton, UserAvatar, PreferencesEditor, PremiumCard],
  template: `
    <section class="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div class="border-b border-secondary/10 pb-4">
        <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary/60">
          <i class="fa-solid fa-id-card text-primary" aria-hidden="true"></i>
          <span>{{ t().eyebrow }}</span>
        </div>
        <h1 class="mt-1 text-2xl font-black tracking-tight text-secondary sm:text-3xl">
          {{ t().title }}
        </h1>
      </div>

      @if (!auth.enabled) {
        <div class="rounded-xl border border-secondary/15 bg-white p-6 shadow-xs text-center space-y-2">
          <p class="text-secondary/70">{{ t().unavailable }}</p>
        </div>
      } @else if (auth.user(); as user) {
        <!-- User Profile Card -->
        <div class="rounded-xl border border-secondary/15 bg-white p-6 shadow-xs flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <app-user-avatar [user]="user" [size]="64" />
            <dl class="space-y-1">
              <div>
                <dt class="text-xs font-bold uppercase tracking-wider text-secondary/60">{{ t().nameLabel }}</dt>
                <dd class="text-base font-bold text-secondary">{{ user.name }}</dd>
              </div>
              <div>
                <dt class="text-xs font-bold uppercase tracking-wider text-secondary/60">{{ t().emailLabel }}</dt>
                <dd class="text-sm text-secondary/80">{{ user.email }}</dd>
              </div>
            </dl>
          </div>

          <div>
            <ui-button variant="outline" (click)="signOut()">
              <i class="fa-solid fa-arrow-right-from-bracket mr-1" aria-hidden="true"></i>
              {{ t().signOut }}
            </ui-button>
          </div>
        </div>

        <!-- Premium Teaser Card -->
        <app-premium-card />

        <!-- Preferences Form -->
        <app-preferences-editor />
      } @else {
        <!-- Signed Out State Card -->
        <div class="rounded-xl border border-secondary/15 bg-white p-6 sm:p-8 shadow-xs space-y-5 text-center max-w-md mx-auto">
          <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary/8 text-secondary">
            <i class="fa-solid fa-user text-xl" aria-hidden="true"></i>
          </div>

          <p class="text-sm text-secondary/80 leading-relaxed">{{ t().signInPrompt }}</p>

          <div class="flex justify-center pt-2">
            <div #googleButton data-google-button></div>
          </div>

          @if (problem(); as message) {
            <p role="alert" class="rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700 border border-red-200">
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
