import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast-service';
import { UiIcon } from '../icon/icon';

@Component({
  selector: 'ui-toast-host',
  imports: [UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-host.html',
})
export class UiToastHost {
  protected readonly toast = inject(ToastService);
}
