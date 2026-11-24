import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  output,
  viewChildren,
} from '@angular/core';
import { UiIcon } from '../icon/icon';

export interface SegmentedOption {
  value: string;
  label: string;
  // Why the option is closed. A locked option cannot be chosen, but it can be touched.
  locked?: 'sign-in' | 'premium';
  // Short text shown next to the lock, for example "Premium".
  lockedLabel?: string;
}

const OPTION_BASE =
  'min-h-9 min-w-11 select-none rounded-lg px-3 font-display text-sm font-bold uppercase tracking-wide transition-all duration-150 ease-out ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';
const SELECTED = 'bg-primary text-secondary shadow-xs';
const UNSELECTED = 'bg-transparent text-ink-muted hover:bg-ink/10 hover:text-ink';
const LOCKED = 'bg-transparent text-ink-faint hover:bg-ink/10';

@Component({
  selector: 'ui-segmented',
  imports: [UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': "stretch() ? 'block' : 'inline-block'" },
  templateUrl: './segmented.html',
})
export class UiSegmented {
  readonly options = input.required<SegmentedOption[]>();
  readonly label = input.required<string>();
  readonly value = model('');
  // Fills the whole width, with options of the same size.
  readonly stretch = input(false, { transform: booleanAttribute });
  // Lets the options go on to another row when they do not fit; each keeps a minimum width.
  readonly wrap = input(false, { transform: booleanAttribute });

  protected readonly groupClass = computed(
    () => `${this.stretch() ? 'flex w-full' : 'inline-flex'}${this.wrap() ? ' flex-wrap' : ''}`,
  );
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
    return `${OPTION_BASE} ${state}${this.stretch() ? ' flex-1' : ''}${this.wrap() ? ' min-w-16' : ''}`;
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
    this.focusOption(target);
    const option = this.options()[target];
    if (!option.locked) this.value.set(option.value);
  }

  private focusOption(index: number): void {
    this.optionEls()[index]?.nativeElement.focus();
  }
}
