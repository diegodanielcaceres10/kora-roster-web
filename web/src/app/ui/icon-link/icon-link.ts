import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ICON_BUTTON_BASE, ICON_BUTTON_LOOKS } from '../icon-button/icon-button-styles';

export type IconLinkVariant = 'default' | 'primary';

// A link that looks like a UiIconButton. It renders a real <a>, so it can be opened in a
// new tab and read as a link by assistive technology.
@Component({
  selector: 'ui-icon-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: { class: 'inline-flex' },
  templateUrl: './icon-link.html',
})
export class UiIconLink {
  // Same as routerLink: a path or the list of its parts, for example ['/', 'es', 'account'].
  readonly link = input.required<string | readonly unknown[]>();
  readonly label = input.required<string>();
  readonly variant = input<IconLinkVariant>('default');

  protected readonly classes = computed(
    () => `${ICON_BUTTON_BASE} ${ICON_BUTTON_LOOKS[this.variant()]}`,
  );
}
