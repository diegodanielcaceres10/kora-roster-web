import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast-service';

@Component({
  selector: 'ui-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="status"
      class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
    >
      @if (toast.message(); as text) {
        <p
          class="animate-toast inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-secondary/95 px-5 py-3 text-sm font-semibold tracking-tight text-white shadow-2xl backdrop-blur-md"
        >
          <i class="fa-solid fa-circle-check text-primary" aria-hidden="true"></i>
          <span>{{ text }}</span>
        </p>
      }
    </div>
  `,
})
export class UiToastHost {
  protected readonly toast = inject(ToastService);
}
