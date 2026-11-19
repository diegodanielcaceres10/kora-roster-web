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
      class="flex rounded-lg border border-ink/20 bg-surface shadow-xs transition-colors focus-within:border-ink focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink"
      [class]="numbered() ? 'max-h-96 overflow-y-auto dark:bg-canvas' : ''"
    >
      @if (numbered()) {
        <div
          data-gutter
          aria-hidden="true"
          class="select-none border-r border-line px-3 py-3.5 text-right font-mono text-xs leading-6 text-ink-faint"
        >
          @for (number of lineNumbers(); track number) {
            <div>{{ number }}</div>
          }
        </div>
      }
      <textarea
        #field
        [id]="fieldId"
        [rows]="numbered() ? lineNumbers().length : (rows() ?? defaultRows)"
        [attr.wrap]="numbered() ? 'off' : null"
        [placeholder]="placeholder()"
        [attr.aria-describedby]="hint() ? hintId : null"
        [value]="value()"
        (input)="onInput($event)"
        class="block w-full bg-transparent p-3.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
        [class]="
          numbered()
            ? 'resize-none overflow-x-auto overflow-y-hidden font-mono leading-6'
            : 'rounded-lg'
        "
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
  // Shows a number beside every line, in a monospace field that grows with its lines.
  readonly numbered = input(false, { transform: booleanAttribute });
  // Keeps the label for assistive technology only, when something else on screen names the field.
  readonly hideLabel = input(false, { transform: booleanAttribute });
  readonly value = model('');

  private readonly uid = nextId++;
  protected readonly fieldId = `ui-textarea-${this.uid}`;
  protected readonly hintId = `ui-textarea-${this.uid}-hint`;
  protected readonly defaultRows = DEFAULT_ROWS;

  // 01, 02, 03... as many as the lines of the value, and never fewer than the rows.
  protected readonly lineNumbers = computed(() => {
    const lines = this.value().split('\n').length;
    const count = Math.max(lines, this.rows() ?? DEFAULT_ROWS);
    return Array.from({ length: count }, (_, index) => String(index + 1).padStart(2, '0'));
  });

  private readonly field = viewChild.required<ElementRef<HTMLTextAreaElement>>('field');

  focus(): void {
    this.field().nativeElement.focus();
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLTextAreaElement).value);
  }
}
