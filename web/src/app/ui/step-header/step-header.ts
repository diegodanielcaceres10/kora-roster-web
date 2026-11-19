import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
  template: `
    <header
      class="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:gap-6"
    >
      <div class="min-w-0">
        <h1 class="text-2xl font-black uppercase tracking-tight text-ink sm:text-3xl">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="mt-1.5 max-w-xl text-sm text-ink-muted">{{ subtitle() }}</p>
        }
      </div>
      @if (steps().length > 0) {
        <nav [attr.aria-label]="stepsLabel()" class="w-full sm:w-auto sm:shrink-0">
          <ol
            class="flex w-full items-center gap-1 rounded-xl border border-line bg-surface-muted p-1 sm:w-auto"
          >
            @for (step of steps(); track $index; let i = $index; let last = $last) {
              <li class="flex flex-1 items-center sm:flex-none">
                <span
                  data-step
                  class="flex-1"
                  [class]="base + ' ' + looks[step.state]"
                  [attr.aria-current]="step.state === 'current' ? 'step' : null"
                >
                  @if (step.state === 'done') {
                    <ui-icon name="check" />
                  } @else if (step.state === 'current') {
                    <span aria-hidden="true" class="size-1.5 rounded-full bg-current"></span>
                  }
                  <span>{{ i + 1 }} {{ step.label }}</span>
                  @if (step.state === 'done' && doneLabel()) {
                    <span class="sr-only"> {{ doneLabel() }}</span>
                  }
                </span>
                @if (!last) {
                  <ui-icon name="chevron-right" class="mx-0.5 hidden text-ink-faint sm:inline-flex" />
                }
              </li>
            }
          </ol>
        </nav>
      }
    </header>
  `,
})
export class UiStepHeader {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly steps = input<readonly StepHeaderStep[]>([]);
  // The accessible name of the list of steps, and what to say after a step that is done.
  readonly stepsLabel = input('');
  readonly doneLabel = input('');

  protected readonly base = BASE;
  protected readonly looks = LOOKS;
}
