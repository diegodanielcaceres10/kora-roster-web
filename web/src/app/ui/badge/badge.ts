import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'primary' | 'alternative' | 'danger';

const BASE =
  'inline-flex select-none items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-ink/8 text-ink-muted border border-line',
  primary: 'bg-primary/20 text-amber-800 border border-primary/40 dark:text-primary',
  alternative: 'bg-alternative text-white shadow-xs',
  danger:
    'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',
};

@Component({
  selector: 'ui-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block' },
  templateUrl: './badge.html',
  styleUrl: './badge.css',
})
export class UiBadge {
  readonly tone = input<BadgeTone>('neutral');

  protected readonly classes = computed(() => `${BASE} ${TONES[this.tone()]}`);
}
