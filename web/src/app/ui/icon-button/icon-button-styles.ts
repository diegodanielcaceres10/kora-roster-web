// The look of a square button that holds only an icon. UiIconButton and UiIconLink share it,
// so a button and a link made to look like one stay the same.
export const ICON_BUTTON_BASE =
  'inline-flex size-11 select-none items-center justify-center rounded-lg border text-base sm:text-lg ' +
  'transition-all duration-150 ease-out active:scale-95 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ' +
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 disabled:shadow-none';

export const ICON_BUTTON_LOOKS = {
  default:
    'border-line bg-surface text-ink-muted hover:border-ink/40 hover:bg-ink/5 hover:text-ink shadow-xs',
  danger:
    'border-red-200 bg-surface text-red-700 hover:border-red-300 hover:bg-red-50 shadow-xs dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10',
  primary:
    'border-primary/40 bg-primary/10 text-amber-700 hover:border-primary hover:bg-primary/20 shadow-xs dark:text-primary',
  pressed: 'border-primary bg-primary text-secondary shadow-xs font-bold',
} as const;
