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
  template: `
    <span
      data-label
      class="block font-mono text-[10px] font-bold uppercase tracking-wider text-ink-muted"
    >
      {{ label() }}
    </span>
    <span
      data-value
      class="mt-1 block font-display text-2xl font-black leading-tight tabular-nums"
      [class]="valueLook()"
    >
      {{ value() }}
    </span>
    @if (note()) {
      <span data-note class="mt-0.5 block font-mono text-[11px] font-bold" [class]="noteLook()">
        {{ note() }}
      </span>
    }
  `,
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
