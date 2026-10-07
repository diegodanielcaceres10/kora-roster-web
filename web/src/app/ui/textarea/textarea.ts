import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

let nextId = 0;

@Component({
  selector: 'ui-textarea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <label [attr.for]="fieldId" class="mb-1 block text-sm font-medium text-secondary">
      {{ label() }}
    </label>
    <textarea
      [id]="fieldId"
      [rows]="rows() ?? 6"
      [placeholder]="placeholder()"
      [attr.aria-describedby]="hint() ? hintId : null"
      [value]="value()"
      (input)="onInput($event)"
      class="block w-full rounded-lg border border-secondary/30 bg-white p-3 text-base text-secondary placeholder:text-secondary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
    ></textarea>
    @if (hint()) {
      <p [id]="hintId" class="mt-1 text-sm text-secondary/70">{{ hint() }}</p>
    }
  `,
})
export class UiTextarea {
  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly rows = input<number | undefined>(undefined);
  readonly hint = input('');
  readonly value = model('');

  private readonly uid = nextId++;
  protected readonly fieldId = `ui-textarea-${this.uid}`;
  protected readonly hintId = `ui-textarea-${this.uid}-hint`;

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLTextAreaElement).value);
  }
}
