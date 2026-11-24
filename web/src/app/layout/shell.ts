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
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly i18n = inject(I18n);
  protected readonly auth = inject(Auth);

  // Written without the accent on purpose, as the author asked.
  protected readonly author = 'Diego Daniel Caceres';
  // The name links to the portfolio of the author. It opens in another tab, so it leaves the app open.
  protected readonly portfolioUrl = 'https://diegodanielcaceres10.github.io/nura/';
  private readonly year = new Date().getFullYear();
  protected readonly copyright = computed(
    () => `© ${this.year} Kora Roster. ${this.i18n.t().footer.rights}`,
  );
}
