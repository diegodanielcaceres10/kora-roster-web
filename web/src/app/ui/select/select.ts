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
  templateUrl: './select.html',
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
