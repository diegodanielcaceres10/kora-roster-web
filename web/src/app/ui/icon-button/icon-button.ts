import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type IconButtonVariant = 'default' | 'danger';

const BASE =
  'inline-flex size-11 items-center justify-center rounded-lg border text-lg transition ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const DEFAULT = 'border-secondary/30 bg-transparent text-secondary hover:bg-secondary/10';
const DANGER = 'border-red-300 bg-transparent text-red-700 hover:bg-red-50';
const PRESSED = 'border-primary bg-primary text-secondary';

@Component({
  selector: 'ui-icon-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-block',
    '[class.pointer-events-none]': 'disabled()',
  },
  template: `
    <button
      type="button"
      [attr.aria-label]="label()"
      [attr.aria-pressed]="pressed()"
      [disabled]="disabled()"
      [class]="classes()"
    >
      <ng-content />
    </button>
  `,
})
export class UiIconButton {
  readonly label = input.required<string>();
  readonly variant = input<IconButtonVariant>('default');
  readonly pressed = input<boolean | undefined>(undefined);
  readonly disabled = input(false);

  protected readonly classes = computed(() => {
    if (this.pressed()) return `${BASE} ${PRESSED}`;
    return `${BASE} ${this.variant() === 'danger' ? DANGER : DEFAULT}`;
  });
}
