import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type IconButtonVariant = 'default' | 'danger';

const BASE =
  'inline-flex size-11 select-none items-center justify-center rounded-lg border text-base sm:text-lg ' +
  'transition-all duration-150 ease-out active:scale-95 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ' +
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 disabled:shadow-none';

const DEFAULT =
  'border-secondary/20 bg-white/80 text-secondary hover:border-secondary/40 hover:bg-secondary/5 shadow-xs';
const DANGER =
  'border-red-200 bg-white/80 text-red-700 hover:border-red-300 hover:bg-red-50 shadow-xs';
const PRESSED = 'border-primary bg-primary text-secondary shadow-xs font-bold';

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
