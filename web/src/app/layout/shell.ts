import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Auth } from '../auth/auth';
import { UserAvatar } from '../auth/user-avatar';
import { I18n } from '../i18n/i18n';
import { LanguageMenu } from '../i18n/language-menu';
import { ThemeToggle } from '../theme/theme-toggle';
import { UiBadge, UiIcon, UiIconLink } from '../ui';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterOutlet,
    LanguageMenu,
    ThemeToggle,
    UserAvatar,
    UiBadge,
    UiIcon,
    UiIconLink,
  ],
  host: { class: 'flex min-h-screen flex-col' },
  template: `
    <header class="sticky top-0 z-40 px-4 pt-3 sm:px-6">
      <div
        class="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border border-line bg-surface/90 px-4 py-2.5 shadow-xs backdrop-blur-md"
      >
        <a
          [routerLink]="['/', i18n.lang()]"
          class="group inline-flex items-center gap-2.5 rounded-lg text-ink transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <img
            src="favicon.png"
            alt=""
            width="32"
            height="32"
            class="size-8 transition group-hover:scale-105"
          />
          <span class="font-display text-xl font-black uppercase tracking-tight">Kora</span>
          <ui-badge tone="primary">Roster</ui-badge>
        </a>
        <div class="flex items-center gap-2">
          <app-theme-toggle />
          <app-language-menu />
          @if (auth.enabled) {
            @if (auth.user(); as user) {
              <a
                [routerLink]="['/', i18n.lang(), 'account']"
                [attr.aria-label]="i18n.t().account.title"
                class="relative inline-flex rounded-full p-0.5 ring-2 ring-primary/60 transition hover:ring-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <app-user-avatar [user]="user" />
                <span
                  aria-hidden="true"
                  class="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-surface bg-alternative"
                ></span>
              </a>
            } @else {
              <ui-icon-link
                variant="primary"
                [link]="['/', i18n.lang(), 'account']"
                [label]="i18n.t().account.signInLink"
              >
                <ui-icon name="user" />
              </ui-icon-link>
            }
          }
        </div>
      </div>
    </header>
    <main class="flex-1"><router-outlet /></main>
    <footer class="px-4 pb-6 pt-10 sm:px-6">
      <div
        class="mx-auto max-w-6xl rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-6"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div class="inline-flex items-center gap-2.5 text-ink">
            <img src="favicon.png" alt="" width="32" height="32" class="size-8" />
            <span class="font-display text-xl font-black uppercase tracking-tight">Kora</span>
            <ui-badge tone="primary">Roster</ui-badge>
          </div>
          <p class="text-sm text-ink-muted">{{ i18n.t().footer.tagline }}</p>
        </div>
        <div
          class="mt-4 flex flex-col gap-1 border-t border-line pt-4 font-mono text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              {{ i18n.t().footer.developedBy }}
              <span class="font-bold text-ink">{{ author }}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {{ i18n.t().footer.portfolio }}:
              <a
                [href]="portfolio.url"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded font-bold text-ink underline decoration-primary decoration-2 underline-offset-4 transition-colors hover:text-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink dark:hover:text-primary"
                >{{ portfolio.name
                }}<span class="sr-only"> ({{ i18n.t().footer.newTab }})</span></a
              >
            </span>
          </p>
          <p>{{ copyright() }}</p>
        </div>
      </div>
    </footer>
  `,
})
export class Shell {
  protected readonly i18n = inject(I18n);
  protected readonly auth = inject(Auth);

  protected readonly author = 'Diego Daniel Cáceres';
  // The portfolio of the author. It opens in another tab, so it leaves the app open.
  protected readonly portfolio = {
    name: 'Nura',
    url: 'https://diegodanielcaceres10.github.io/nura/',
  };
  private readonly year = new Date().getFullYear();
  protected readonly copyright = computed(
    () => `© ${this.year} Kora Roster. ${this.i18n.t().footer.rights}`,
  );
}
