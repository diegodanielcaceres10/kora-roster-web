import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  viewChild,
} from '@angular/core';

let nextId = 0;

const TEXT_FIELD =
  'block w-full rounded-lg border border-ink/20 bg-surface px-3.5 py-2 text-base text-ink placeholder:text-ink-faint shadow-xs transition-colors focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';
const COLOR_FIELD =
  'block h-11 w-16 cursor-pointer rounded-lg border border-ink/20 bg-surface p-1 shadow-xs transition-colors focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

@Component({
  selector: 'ui-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './input.html',
})
export class UiInput {
  readonly label = input.required<string>();
  // Keeps the label for screen readers but does not show it.
  readonly labelHidden = input(false);
  readonly type = input<'text' | 'color'>('text');
  readonly maxLength = input<number | undefined>(undefined);
  // Shows how many characters are used out of the limit; it needs a `maxLength`.
  readonly showCount = input(false, { transform: booleanAttribute });
  readonly placeholder = input('');
  readonly hint = input('');
  readonly value = model('');

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  private readonly uid = nextId++;
  protected readonly fieldId = `ui-input-${this.uid}`;
  protected readonly hintId = `ui-input-${this.uid}-hint`;

  protected readonly labelClass = computed(() =>
    this.labelHidden() ? 'sr-only' : 'mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted',
  );
  protected readonly fieldClass = computed(() =>
    this.type() === 'color' ? COLOR_FIELD : TEXT_FIELD,
  );

  focus(): void {
    this.field().nativeElement.focus();
  }

  select(): void {
    this.field().nativeElement.select();
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }
}
