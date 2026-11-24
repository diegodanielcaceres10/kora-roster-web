import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatTone = 'default' | 'primary';
export type StatNoteTone = 'muted' | 'warning';

const VALUE_LOOKS: Record<StatTone, string> = {
  default: 'text-ink',
  primary: 'text-amber-700 dark:text-primary',
};
const NOTE_LOOKS: Record<StatNoteTone, string> = {
  muted: 'text-ink-muted',
  warning: 'text-amber-700 dark:text-amber-300',
};

// A small tile with one figure: a label, the figure itself and an optional note under it.
@Component({
  selector: 'ui-stat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block rounded-xl border border-line bg-surface-muted/60 p-3' },
  templateUrl: './stat.html',
})
export class UiStat {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly note = input('');
  readonly valueTone = input<StatTone>('default');
  readonly noteTone = input<StatNoteTone>('muted');

  protected readonly valueLook = computed(() => VALUE_LOOKS[this.valueTone()]);
  protected readonly noteLook = computed(() => NOTE_LOOKS[this.noteTone()]);
}
