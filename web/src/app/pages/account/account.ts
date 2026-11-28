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
import { UserAvatar } from '../../auth/user-avatar/user-avatar';
import { I18n } from '../../i18n/i18n';
import { PageMeta } from '../../i18n/page-meta';
import { UiButton, UiIcon } from '../../ui';
import { PreferencesEditor } from './preferences-editor/preferences-editor';

@Component({
  selector: 'app-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButton, UserAvatar, PreferencesEditor, UiIcon],
  templateUrl: './account.html',
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
