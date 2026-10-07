import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'md' | 'lg';

const BASE =
  'inline-flex w-full items-center justify-center gap-2 rounded-lg font-semibold ' +
  'transition focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-secondary disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-secondary hover:brightness-95',
  secondary: 'bg-secondary text-white hover:brightness-125',
  outline: 'border-2 border-secondary bg-transparent text-secondary hover:bg-secondary/10',
  ghost: 'bg-transparent text-secondary hover:bg-secondary/10',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-base',
  lg: 'min-h-13 px-6 text-lg',
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
