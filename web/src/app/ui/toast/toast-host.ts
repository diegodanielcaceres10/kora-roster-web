import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Toast } from './toast';
import { UiIcon } from '../icon/icon';

@Component({
  selector: 'ui-toast-host',
  imports: [UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-host.html',
})
export class UiToastHost {
  protected readonly toast = inject(Toast);
}
