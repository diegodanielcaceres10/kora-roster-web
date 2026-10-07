import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'primary' | 'alternative' | 'danger';

const BASE = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-secondary/10 text-secondary',
  primary: 'bg-primary/30 text-secondary',
  alternative: 'bg-alternative text-white',
  danger: 'bg-red-100 text-red-800',
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
