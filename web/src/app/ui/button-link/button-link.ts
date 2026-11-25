import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type ButtonFont, type ButtonSize, type ButtonVariant } from '../button/button';
import { BUTTON_BASE, BUTTON_FONTS, BUTTON_SIZES, BUTTON_VARIANTS } from '../button/button-styles';

// A link that looks like a UiButton. It renders a real <a>, so it can be opened in a new tab
// and is read as a link by assistive technology.
@Component({
  selector: 'ui-button-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: {
    '[class.inline-block]': '!stretch()',
    '[class.block]': 'stretch()',
    '[class.w-full]': 'stretch()',
  },
  templateUrl: './button-link.html',
})
export class UiButtonLink {
  // Same as routerLink: a path or the list of its parts, for example ['/', 'es', 'friendly'].
  readonly link = input.required<string | readonly unknown[]>();
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly font = input<ButtonFont>('display');
  readonly stretch = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(
    () => `${BUTTON_BASE} ${BUTTON_FONTS[this.font()]} ${BUTTON_VARIANTS[this.variant()]} ${BUTTON_SIZES[this.size()]}`,
  );
}
