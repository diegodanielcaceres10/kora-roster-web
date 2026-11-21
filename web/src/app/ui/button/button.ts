import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex w-full select-none items-center justify-center gap-2 rounded-xl font-display font-bold uppercase tracking-wide ' +
  'transition-all duration-150 ease-out active:scale-[0.98] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ' +
  'disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 disabled:shadow-none';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-secondary shadow-sm shadow-primary/25 hover:brightness-95 hover:shadow-md',
  secondary: 'bg-ink text-canvas shadow-xs hover:bg-ink/90 hover:shadow-sm',
  outline: 'border-2 border-ink/25 bg-surface text-ink hover:border-ink hover:bg-ink/5',
  ghost: 'bg-transparent text-ink hover:bg-ink/10',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 text-xs sm:min-h-9',
  md: 'min-h-11 px-4 text-[13px] sm:text-sm',
  lg: 'min-h-13 px-6 text-sm sm:text-base',
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
    () => `${BASE} ${VARIANTS[this.variant()]} ${SIZES[this.size()]}`,
  );
}
