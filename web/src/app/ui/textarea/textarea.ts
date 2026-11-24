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
  templateUrl: './textarea.html',
  styleUrl: './textarea.css',
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
