import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../i18n/i18n';
import { LockReason } from './entitlements';

// The explanation shown under a control that was touched while locked. The status region
// is always in the page, so a message that appears gets announced. When the lock is a
// missing account it also offers the way to sign in.
@Component({
  selector: 'app-lock-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div role="status">
      @if (message(); as text) {
        <p class="text-sm text-secondary/80">
          {{ text }}
          @if (reason() === 'sign-in') {
            <a
              [routerLink]="['/', i18n.lang(), 'cuenta']"
              class="font-semibold underline underline-offset-4"
              >{{ i18n.t().locks.signInLink }}</a
            >
          }
        </p>
      }
    </div>
  `,
})
export class LockNotice {
  protected readonly i18n = inject(I18n);

  readonly reason = input<LockReason | null>(null);
  readonly message = input<string | null>(null);
}
