import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BUTTON_BASE, BUTTON_SIZES, BUTTON_VARIANTS } from './button-styles';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-block',
    '[class.pointer-events-none]': 'disabled()',
  },
  template: `
    <button
      [attr.type]="type()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel() ?? null"
      [attr.aria-describedby]="describedBy() ?? null"
      [class]="classes()"
    >
      <ng-content />
    </button>
  `,
})
export class UiButton {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly ariaLabel = input<string | undefined>(undefined);
  // The id of the text that describes the button, when its label alone is not enough.
  readonly describedBy = input<string | undefined>(undefined);

  protected readonly classes = computed(
    () => `${BUTTON_BASE} ${BUTTON_VARIANTS[this.variant()]} ${BUTTON_SIZES[this.size()]}`,
  );
}
