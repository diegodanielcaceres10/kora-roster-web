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

@Component({
  selector: 'app-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButton, UserAvatar],
  template: `
    <section class="mx-auto max-w-3xl space-y-6 p-4">
      <h1>{{ t().title }}</h1>

      @if (!auth.enabled) {
        <p>{{ t().unavailable }}</p>
      } @else if (auth.user(); as user) {
        <div class="flex items-center gap-4">
          <app-user-avatar [user]="user" [size]="64" />
          <dl class="space-y-2">
            <div>
              <dt class="text-sm text-secondary/70">{{ t().nameLabel }}</dt>
              <dd class="font-semibold">{{ user.name }}</dd>
            </div>
            <div>
              <dt class="text-sm text-secondary/70">{{ t().emailLabel }}</dt>
              <dd>{{ user.email }}</dd>
            </div>
          </dl>
        </div>
        <ui-button variant="outline" (click)="signOut()">{{ t().signOut }}</ui-button>
      } @else {
        <p>{{ t().signInPrompt }}</p>
        <div #googleButton data-google-button></div>
        @if (problem(); as message) {
          <p role="alert" class="font-semibold text-red-700">{{ message }}</p>
        }
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
    // The place for Google's button appears and disappears with the sign in state,
    // so the button is drawn every time a new place shows up.
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
