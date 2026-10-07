import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast-service';

@Component({
  selector: 'ui-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="status"
      class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
    >
      @if (toast.message(); as text) {
        <p class="rounded-lg bg-secondary px-4 py-3 text-white shadow-lg">{{ text }}</p>
      }
    </div>
  `,
})
export class UiToastHost {
  protected readonly toast = inject(ToastService);
}
