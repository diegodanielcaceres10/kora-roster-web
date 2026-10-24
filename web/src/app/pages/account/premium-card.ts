import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18n } from '../../i18n/i18n';
import { LockNotice } from '../../plans/lock-notice';
import { UiCard } from '../../ui';

// What Premium will bring. It only shows; nothing can be bought yet.
@Component({
  selector: 'app-premium-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiCard, LockNotice],
  template: `
    <ui-card accent="primary">
      <h2 card-header class="flex items-center gap-2">
        <i class="fa-solid fa-lock" aria-hidden="true"></i>
        {{ t().title }}
      </h2>
      <p class="mb-2 text-secondary/80">{{ t().intro }}</p>
      <ul class="space-y-1">
        @for (item of items(); track item) {
          <li>
            <button
              type="button"
              aria-disabled="true"
              class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-secondary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              (click)="touch()"
            >
              <i class="fa-solid fa-lock text-secondary/60" aria-hidden="true"></i>
              <span>{{ item }}</span>
            </button>
          </li>
        }
      </ul>
      <app-lock-notice [reason]="notice() ? 'premium' : null" [message]="notice()" />
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
