// The look of a square button that holds only an icon. UiIconButton and UiIconLink share it,
// so a button and a link made to look like one stay the same.
export const ICON_BUTTON_BASE =
  'inline-flex size-11 select-none items-center justify-center rounded-lg text-base sm:text-lg ' +
  'transition-all duration-150 ease-out active:scale-95 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ' +
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 disabled:shadow-none';

export const ICON_BUTTON_LOOKS = {
  default:
    'bg-transparent text-ink-muted hover:bg-ink/10 hover:text-ink',
  danger:
    'bg-transparent text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300',
  primary:
    'bg-primary/10 text-amber-700 hover:bg-primary/20 dark:text-primary',
  pressed: 'bg-primary/20 text-amber-700 dark:text-primary font-bold',
} as const;
