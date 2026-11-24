import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AuthUser } from './credential';

// The photo of the person, or their initial when Google sent none. It is decoration:
// whatever links to it gives it a name.
@Component({
  selector: 'app-user-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  templateUrl: './user-avatar.html',
})
export class UserAvatar {
  readonly user = input.required<AuthUser>();
  readonly size = input(32);

  protected readonly initial = computed(
    () => Array.from(this.user().name.trim())[0]?.toUpperCase() ?? '?',
  );
}
