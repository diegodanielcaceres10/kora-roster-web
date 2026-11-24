import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UiIcon } from '../icon/icon';

export type StepState = 'done' | 'current' | 'todo';

export interface StepHeaderStep {
  label: string;
  state: StepState;
}

const BASE =
  'flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wide transition-colors duration-150';
const LOOKS: Record<StepState, string> = {
  current: 'bg-primary text-secondary shadow-xs',
  done: 'border border-alternative/30 bg-alternative/10 text-alternative dark:text-emerald-300',
  todo: 'text-ink-faint',
};

// The top of a page that goes through steps: the title of the current step as the heading,
// a line that explains it, and the steps with where the person stands. Leave `steps` out for a
// plain title.
@Component({
  selector: 'ui-step-header',
  imports: [UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './step-header.html',
})
export class UiStepHeader {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly steps = input<readonly StepHeaderStep[]>([]);
  // The accessible name of the list of steps, and what to say after a step that is done.
  readonly stepsLabel = input('');
  readonly doneLabel = input('');
  // Colors the last word of the title, for a title like "Teams confirmed".
  readonly accentLast = input(false, { transform: booleanAttribute });

  protected readonly parts = computed(() => {
    const title = this.title().trim();
    const cut = title.lastIndexOf(' ');
    if (!this.accentLast() || cut < 0) return { lead: title, accent: '' };
    return { lead: title.slice(0, cut), accent: title.slice(cut + 1) };
  });

  protected readonly base = BASE;
  protected readonly looks = LOOKS;
}
