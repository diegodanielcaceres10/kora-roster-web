import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Auth } from '../auth/auth';
import { UserAvatar } from '../auth/user-avatar';
import { I18n } from '../i18n/i18n';
import { LanguageSelector } from '../i18n/language-selector';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterOutlet, LanguageSelector, UserAvatar],
  host: { class: 'flex min-h-screen flex-col' },
  template: `
    <header class="border-b border-secondary/10 bg-white">
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-3 p-3">
        <a [routerLink]="['/', i18n.lang()]" class="flex items-center gap-2 font-semibold">
          <img src="favicon.png" alt="" width="32" height="32" />
          <span>Kora</span>
        </a>
        <div class="flex items-center gap-3">
          @if (auth.enabled) {
            @if (auth.user(); as user) {
              <a
                [routerLink]="['/', i18n.lang(), 'cuenta']"
                [attr.aria-label]="i18n.t().account.title"
                class="inline-flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              >
                <app-user-avatar [user]="user" />
              </a>
            } @else {
              <a
                [routerLink]="['/', i18n.lang(), 'cuenta']"
                class="text-sm font-semibold underline-offset-4 hover:underline"
                >{{ i18n.t().account.signInLink }}</a
              >
            }
          }
          <app-language-selector />
        </div>
      </div>
    </header>
    <main class="flex-1"><router-outlet /></main>
    <footer class="border-t border-secondary/10 p-4 text-center text-sm text-secondary/70">
      <p>Kora Roster</p>
    </footer>
  `,
})
export class Shell {
  protected readonly i18n = inject(I18n);
  protected readonly auth = inject(Auth);
}
