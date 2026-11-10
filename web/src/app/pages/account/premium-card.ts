import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18n } from '../../i18n/i18n';
import { LockNotice } from '../../plans/lock-notice';
import { UiCard } from '../../ui';

@Component({
  selector: 'app-premium-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiCard, LockNotice],
  template: `
    <ui-card accent="primary">
      <div card-header class="border-b border-secondary/10 pb-3">
        <h2 class="flex items-center gap-2 text-lg font-bold text-secondary">
          <i class="fa-solid fa-lock text-primary" aria-hidden="true"></i>
          {{ t().title }}
        </h2>
      </div>

      <div class="space-y-3 pt-1">
        <p class="text-sm font-medium text-secondary/80">{{ t().intro }}</p>
        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          @for (item of items(); track item) {
            <li>
              <button
                type="button"
                aria-disabled="true"
                class="flex w-full items-center gap-2.5 rounded-lg border border-secondary/10 bg-secondary/[0.02] px-3 py-2.5 text-left text-sm font-medium text-secondary transition hover:bg-secondary/5 hover:border-secondary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                (click)="touch()"
              >
                <i class="fa-solid fa-lock text-secondary/40 text-xs shrink-0" aria-hidden="true"></i>
                <span>{{ item }}</span>
              </button>
            </li>
          }
        </ul>
        <app-lock-notice [reason]="notice() ? 'premium' : null" [message]="notice()" />
      </div>
    </ui-card>
  `,
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
