import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18n } from '../../i18n/i18n';
import { LockNotice } from '../../plans/lock-notice';
import { UiCard, UiIcon } from '../../ui';

@Component({
  selector: 'app-premium-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiCard, LockNotice, UiIcon],
  templateUrl: './premium-card.html',
})
export class PremiumCard {
  private readonly i18n = inject(I18n);

  protected readonly t = computed(() => this.i18n.t().premiumCard);
  protected readonly items = computed(() => {
    const { moreTeams, logo, records, attendance, signUps } = this.t();
    return [moreTeams, logo, records, attendance, signUps];
  });
  protected readonly notice = signal<string | null>(null);

  protected touch(): void {
    this.notice.set(this.i18n.t().locks.premiumSoon);
  }
}
