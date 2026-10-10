import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { I18n } from '../i18n/i18n';
import { LanguageSelector } from '../i18n/language-selector';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterOutlet, LanguageSelector],
  host: { class: 'flex min-h-screen flex-col' },
  template: `
    <header class="border-b border-secondary/10 bg-white">
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-3 p-3">
        <a [routerLink]="['/', i18n.lang()]" class="flex items-center gap-2 font-semibold">
          <img src="favicon.png" alt="" width="32" height="32" />
          <span>Kora</span>
        </a>
        <app-language-selector />
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
}
