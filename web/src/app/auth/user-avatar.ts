import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AuthUser } from './credential';

// The photo of the person, or their initial when Google sent none. It is decoration:
// whatever links to it gives it a name.
@Component({
  selector: 'app-user-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    @if (user().picture) {
      <img
        [src]="user().picture"
        alt=""
        [attr.width]="size()"
        [attr.height]="size()"
        referrerpolicy="no-referrer"
        class="rounded-full object-cover"
      />
    } @else {
      <span
        aria-hidden="true"
        class="inline-flex items-center justify-center rounded-full bg-primary font-bold text-secondary"
        [style.width.px]="size()"
        [style.height.px]="size()"
        >{{ initial() }}</span
      >
    }
  `,
})
export class UserAvatar {
  readonly user = input.required<AuthUser>();
  readonly size = input(32);

  protected readonly initial = computed(
    () => Array.from(this.user().name.trim())[0]?.toUpperCase() ?? '?',
  );
}
