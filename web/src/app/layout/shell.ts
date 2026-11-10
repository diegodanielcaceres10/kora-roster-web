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
    <header class="sticky top-0 z-40 border-b border-secondary/10 bg-white/95 backdrop-blur-md">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a
          [routerLink]="['/', i18n.lang()]"
          class="group inline-flex items-center gap-2.5 font-bold tracking-tight text-secondary transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          <img src="favicon.png" alt="" width="32" height="32" class="size-8 transition group-hover:scale-105" />
          <div class="flex items-baseline gap-1.5">
            <span class="text-xl font-black tracking-tight">Kora</span>
            <span class="rounded bg-secondary/8 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary/70">
              Roster
            </span>
          </div>
        </a>
        <div class="flex items-center gap-3 sm:gap-4">
          @if (auth.enabled) {
            @if (auth.user(); as user) {
              <a
                [routerLink]="['/', i18n.lang(), 'cuenta']"
                [attr.aria-label]="i18n.t().account.title"
                class="inline-flex rounded-full transition hover:ring-2 hover:ring-secondary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              >
                <app-user-avatar [user]="user" />
              </a>
            } @else {
              <a
                [routerLink]="['/', i18n.lang(), 'cuenta']"
                class="rounded-md px-2.5 py-1 text-sm font-semibold text-secondary transition hover:bg-secondary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                >{{ i18n.t().account.signInLink }}</a
              >
            }
          }
          <div class="h-4 w-px bg-secondary/15" aria-hidden="true"></div>
          <app-language-selector />
        </div>
      </div>
    </header>
    <main class="flex-1"><router-outlet /></main>
    <footer class="border-t border-secondary/10 bg-white py-6 text-center text-xs text-secondary/60">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
        <p class="font-medium">Kora Roster • Minimal Sports Utility</p>
        <p class="text-[11px] text-secondary/50">Sorteador táctico de equipos para fútbol entre amigos</p>
      </div>
    </footer>
  `,
})
export class Shell {
  protected readonly i18n = inject(I18n);
  protected readonly auth = inject(Auth);
}
