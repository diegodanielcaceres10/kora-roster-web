import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  viewChild,
} from '@angular/core';
import { ICON_BUTTON_BASE, ICON_BUTTON_LOOKS } from './icon-button-styles';

export type IconButtonVariant = 'default' | 'danger';

@Component({
  selector: 'ui-icon-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-block',
    '[class.pointer-events-none]': 'disabled()',
  },
  templateUrl: './icon-button.html',
})
export class UiIconButton {
  readonly label = input.required<string>();
  readonly variant = input<IconButtonVariant>('default');
  readonly pressed = input<boolean | undefined>(undefined);
  // For a button that opens and closes something: announces whether it is open.
  readonly expanded = input<boolean | undefined>(undefined);
  readonly disabled = input(false);

  private readonly control = viewChild.required<ElementRef<HTMLButtonElement>>('control');

  protected readonly classes = computed(() => {
    const look = this.pressed() ? 'pressed' : this.variant();
    return `${ICON_BUTTON_BASE} ${ICON_BUTTON_LOOKS[look]}`;
  });

  focus(): void {
    this.control().nativeElement.focus();
  }
}
