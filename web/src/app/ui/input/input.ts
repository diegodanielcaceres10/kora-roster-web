import {
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
  'block w-full rounded-lg border border-secondary/30 bg-white px-3 py-2 text-base text-secondary placeholder:text-secondary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary';
const COLOR_FIELD =
  'block h-11 w-16 cursor-pointer rounded-lg border border-secondary/30 bg-white p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary';

@Component({
  selector: 'ui-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <label [attr.for]="fieldId" [class]="labelClass()">{{ label() }}</label>
    <input
      #field
      [id]="fieldId"
      [attr.type]="type()"
      [attr.maxlength]="maxLength() ?? null"
      [placeholder]="placeholder()"
      [attr.aria-describedby]="hint() ? hintId : null"
      [value]="value()"
      (input)="onInput($event)"
      [class]="fieldClass()"
    />
    @if (hint()) {
      <p [id]="hintId" class="mt-1 text-sm text-secondary/70">{{ hint() }}</p>
    }
  `,
})
export class UiInput {
  readonly label = input.required<string>();
  // Keeps the label for screen readers but does not show it.
  readonly labelHidden = input(false);
  readonly type = input<'text' | 'color'>('text');
  readonly maxLength = input<number | undefined>(undefined);
  readonly placeholder = input('');
  readonly hint = input('');
  readonly value = model('');

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  private readonly uid = nextId++;
  protected readonly fieldId = `ui-input-${this.uid}`;
  protected readonly hintId = `ui-input-${this.uid}-hint`;

  protected readonly labelClass = computed(() =>
    this.labelHidden() ? 'sr-only' : 'mb-1 block text-sm font-medium text-secondary',
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
