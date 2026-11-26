// The look of a button. UiButton and UiButtonLink share it, so a link made to look like a button
// stays the same as a real one.
export const BUTTON_BASE =
  'inline-flex w-full select-none items-center justify-center gap-2 rounded-xl font-bold uppercase ' +
  'transition-all duration-150 ease-out active:scale-[0.98] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ' +
  'disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 disabled:shadow-none';

export const BUTTON_FONTS = {
  display: 'font-display tracking-wide',
  mono: 'font-mono tracking-wider',
} as const;

export const BUTTON_VARIANTS = {
  primary: 'bg-primary text-secondary shadow-sm shadow-primary/25 hover:brightness-95 hover:shadow-md',
  secondary: 'bg-ink text-canvas shadow-xs hover:bg-ink/90 hover:shadow-sm',
  outline: 'border border-line bg-surface text-ink hover:border-ink/40',
  ghost: 'border border-line bg-surface text-ink-muted hover:border-ink/40 hover:text-ink',
} as const;

export const BUTTON_SIZES = {
  sm: 'min-h-11 px-3 text-xs sm:min-h-9',
  md: 'min-h-11 px-4 text-[13px] sm:text-sm',
  lg: 'min-h-13 px-6 text-sm sm:text-base',
} as const;
