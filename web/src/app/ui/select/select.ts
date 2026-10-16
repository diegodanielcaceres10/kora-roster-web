import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
}

let nextId = 0;

@Component({
  selector: 'ui-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <label [attr.for]="fieldId" class="mb-1 block text-sm font-medium text-secondary">
      {{ label() }}
    </label>
    <select
      [id]="fieldId"
      (change)="onChange($event)"
      class="block min-h-11 w-full rounded-lg border border-secondary/30 bg-white px-3 py-2 text-base text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
    >
      @for (option of options(); track option.value) {
        <option [value]="option.value" [selected]="option.value === value()">
          {{ option.label }}
        </option>
      }
    </select>
  `,
})
export class UiSelect {
  readonly label = input.required<string>();
  readonly options = input.required<SelectOption[]>();
  readonly value = model('');

  protected readonly fieldId = `ui-select-${nextId++}`;

  protected onChange(event: Event): void {
    this.value.set((event.target as HTMLSelectElement).value);
  }
}
