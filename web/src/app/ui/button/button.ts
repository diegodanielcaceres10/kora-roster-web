import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BUTTON_BASE, BUTTON_FONTS, BUTTON_SIZES, BUTTON_VARIANTS } from './button-styles';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonFont = 'display' | 'mono';

@Component({
  selector: 'ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.inline-block]': '!stretch()',
    '[class.block]': 'stretch()',
    '[class.w-full]': 'stretch()',
    '[class.pointer-events-none]': 'disabled()',
  },
  templateUrl: './button.html',
})
export class UiButton {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly font = input<ButtonFont>('display');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly stretch = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | undefined>(undefined);
  // The id of the text that describes the button, when its label alone is not enough.
  readonly describedBy = input<string | undefined>(undefined);

  protected readonly classes = computed(
    () => `${BUTTON_BASE} ${BUTTON_FONTS[this.font()]} ${BUTTON_VARIANTS[this.variant()]} ${BUTTON_SIZES[this.size()]}`,
  );
}
