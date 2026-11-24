import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  model,
  viewChild,
} from '@angular/core';

let nextId = 0;

const DEFAULT_ROWS = 6;

@Component({
  selector: 'ui-textarea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <label
      [attr.for]="fieldId"
      class="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted"
      [class.sr-only]="hideLabel()"
    >
      {{ label() }}
    </label>
    <div
      class="rounded-lg border border-ink/20 bg-surface shadow-xs transition-colors focus-within:border-ink focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink"
    >
      <textarea
        #field
        [id]="fieldId"
        [rows]="rows() ?? defaultRows"
        [placeholder]="placeholder()"
        [attr.aria-describedby]="hint() ? hintId : null"
        [value]="value()"
        (input)="onInput($event)"
        class="block w-full resize-y rounded-lg bg-transparent p-3.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
      ></textarea>
    </div>
    @if (hint()) {
      <p [id]="hintId" class="mt-1.5 text-xs text-ink-muted">{{ hint() }}</p>
    }
  `,
})
export class UiTextarea {
  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly rows = input<number | undefined>(undefined);
  readonly hint = input('');
  // Keeps the label for assistive technology only, when something else on screen names the field.
  readonly hideLabel = input(false, { transform: booleanAttribute });
  readonly value = model('');

  private readonly uid = nextId++;
  protected readonly fieldId = `ui-textarea-${this.uid}`;
  protected readonly hintId = `ui-textarea-${this.uid}-hint`;
  protected readonly defaultRows = DEFAULT_ROWS;

  private readonly field = viewChild.required<ElementRef<HTMLTextAreaElement>>('field');

  focus(): void {
    this.field().nativeElement.focus();
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLTextAreaElement).value);
  }
}
