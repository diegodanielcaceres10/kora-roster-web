import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  viewChildren,
} from '@angular/core';

export interface SegmentedOption {
  value: string;
  label: string;
}

const OPTION_BASE =
  'min-h-9 min-w-11 rounded-md px-3 text-sm font-semibold transition ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary';
const SELECTED = 'bg-secondary text-white';
const UNSELECTED = 'bg-transparent text-secondary hover:bg-secondary/10';

@Component({
  selector: 'ui-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block' },
  template: `
    <div
      role="radiogroup"
      [attr.aria-label]="label()"
      class="inline-flex gap-1 rounded-lg border border-secondary/30 p-1"
    >
      @for (option of options(); track option.value; let i = $index) {
        <button
          #option
          type="button"
          role="radio"
          [attr.aria-checked]="option.value === value()"
          [tabindex]="i === tabbableIndex() ? 0 : -1"
          [class]="optionClass(option.value)"
          (click)="select(i)"
          (keydown)="onKeydown($event, i)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class UiSegmented {
  readonly options = input.required<SegmentedOption[]>();
  readonly label = input.required<string>();
  readonly value = model('');

  private readonly optionEls = viewChildren<ElementRef<HTMLButtonElement>>('option');

  protected readonly tabbableIndex = computed(() => {
    const selected = this.options().findIndex((o) => o.value === this.value());
    return selected < 0 ? 0 : selected;
  });

  protected optionClass(optionValue: string): string {
    return `${OPTION_BASE} ${optionValue === this.value() ? SELECTED : UNSELECTED}`;
  }

  protected select(index: number): void {
    this.value.set(this.options()[index].value);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const last = this.options().length - 1;
    let target: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        target = index === last ? 0 : index + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        target = index === 0 ? last : index - 1;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.select(target);
    this.optionEls()[target].nativeElement.focus();
  }
}
