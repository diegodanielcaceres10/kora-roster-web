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
    <label [attr.for]="fieldId" class="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted">
      {{ label() }}
    </label>
    <select
      [id]="fieldId"
      (change)="onChange($event)"
      class="block min-h-11 w-full rounded-lg border border-ink/30 bg-surface px-3 py-2 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
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
