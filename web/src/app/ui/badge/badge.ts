import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'primary' | 'alternative' | 'danger';

const BASE =
  'inline-flex select-none items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-secondary/8 text-secondary border border-secondary/15',
  primary: 'bg-primary/25 text-secondary border border-primary/40',
  alternative: 'bg-alternative text-white shadow-xs',
  danger: 'bg-red-50 text-red-700 border border-red-200',
};

@Component({
  selector: 'ui-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block' },
  template: `<span [class]="classes()"><ng-content /></span>`,
})
export class UiBadge {
  readonly tone = input<BadgeTone>('neutral');

  protected readonly classes = computed(() => `${BASE} ${TONES[this.tone()]}`);
}
