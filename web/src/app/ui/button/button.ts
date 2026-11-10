import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'md' | 'lg';

const BASE =
  'inline-flex w-full select-none items-center justify-center gap-2 rounded-lg font-semibold tracking-tight ' +
  'transition-all duration-150 ease-out active:scale-[0.98] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ' +
  'disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 disabled:shadow-none';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-secondary font-bold shadow-xs hover:brightness-95 hover:shadow-sm',
  secondary:
    'bg-secondary text-white font-semibold shadow-xs hover:bg-secondary/90 hover:shadow-sm',
  outline:
    'border-2 border-secondary/25 bg-transparent text-secondary hover:border-secondary hover:bg-secondary/5',
  ghost: 'bg-transparent text-secondary hover:bg-secondary/10',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-sm sm:text-base',
  lg: 'min-h-13 px-6 text-base sm:text-lg',
};

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

  protected readonly classes = computed(
    () => `${BASE} ${VARIANTS[this.variant()]} ${SIZES[this.size()]}`,
  );
}
