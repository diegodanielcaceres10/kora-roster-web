import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  output,
  viewChildren,
} from '@angular/core';

export interface SegmentedOption {
  value: string;
  label: string;
  // Why the option is closed. A locked option cannot be chosen, but it can be touched.
  locked?: 'sign-in' | 'premium';
  // Short text shown next to the lock, for example "Premium".
  lockedLabel?: string;
}

const OPTION_BASE =
  'min-h-9 min-w-11 rounded-md px-3 text-sm font-semibold transition ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary';
const SELECTED = 'bg-secondary text-white';
const UNSELECTED = 'bg-transparent text-secondary hover:bg-secondary/10';
const LOCKED = 'bg-transparent text-secondary/70 hover:bg-secondary/10';

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
          [attr.aria-checked]="isSelected(option)"
          [attr.aria-disabled]="option.locked ? 'true' : null"
          [tabindex]="i === tabbableIndex() ? 0 : -1"
          [class]="optionClass(option)"
          (click)="activate(i)"
          (keydown)="onKeydown($event, i)"
        >
          {{ option.label }}
          @if (option.locked) {
            <i class="fa-solid fa-lock ml-1 text-xs" aria-hidden="true"></i>
            @if (option.lockedLabel) {
              <span class="ml-1 text-xs font-bold uppercase">{{ option.lockedLabel }}</span>
            }
          }
        </button>
      }
    </div>
  `,
})
export class UiSegmented {
  readonly options = input.required<SegmentedOption[]>();
  readonly label = input.required<string>();
  readonly value = model('');
  // Emits the option when somebody touches one that is locked; the value does not change.
  readonly lockedSelect = output<SegmentedOption>();

  private readonly optionEls = viewChildren<ElementRef<HTMLButtonElement>>('option');

  protected readonly tabbableIndex = computed(() => {
    const selected = this.options().findIndex((o) => !o.locked && o.value === this.value());
    return selected < 0 ? 0 : selected;
  });

  protected isSelected(option: SegmentedOption): boolean {
    return !option.locked && option.value === this.value();
  }

  protected optionClass(option: SegmentedOption): string {
    const state = option.locked ? LOCKED : this.isSelected(option) ? SELECTED : UNSELECTED;
    return `${OPTION_BASE} ${state}`;
  }

  protected activate(index: number): void {
    const option = this.options()[index];
    if (option.locked) this.lockedSelect.emit(option);
    else this.value.set(option.value);
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
    // The keys reach every option, so a locked one can be found and read; only the open
    // ones are also selected.
    const option = this.options()[target];
    if (!option.locked) this.value.set(option.value);
    this.optionEls()[target].nativeElement.focus();
  }
}
