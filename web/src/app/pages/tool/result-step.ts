import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DEFAULT_TEAM_ICONS } from '../../core/format-teams';
import { I18n } from '../../i18n/i18n';
import { AmistosoStore } from '../../state/amistoso.store';
import { ToastService, UiButton, UiCard } from '../../ui';

@Component({
  selector: 'app-result-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButton, UiCard],
  template: `
    <section class="space-y-4">
      <h2>{{ t().result.title }}</h2>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        @for (team of teams(); track $index; let i = $index) {
          <ui-card>
            <h3 card-header>{{ icons[i] }} {{ t().teamTitle(i + 1) }}</h3>
            <ol class="space-y-1">
              @for (player of team; track player.id; let n = $index) {
                <li class="flex items-center gap-2">
                  <span class="w-6 text-right font-semibold">{{ n + 1 }}.</span>
                  <span>{{ player.name }}</span>
                  @if (player.isGoalkeeper) {
                    <i class="fa-solid fa-mitten text-alternative" aria-hidden="true"></i>
                    <span class="sr-only">{{ t().preview.goalkeeper }}</span>
                  }
                </li>
              }
            </ol>
          </ui-card>
        }
      </div>

      <div class="space-y-2">
        <h3>{{ t().result.whatsappTitle }}</h3>
        <pre class="overflow-x-auto whitespace-pre-wrap rounded-lg bg-secondary/5 p-3 text-sm">{{
          store.whatsappText()
        }}</pre>
      </div>

      <div class="flex flex-wrap gap-3">
        <ui-button size="lg" (click)="copy()">
          <i class="fa-solid fa-copy" aria-hidden="true"></i>
          {{ t().result.copy }}
        </ui-button>
        <ui-button variant="outline" (click)="store.draw()">
          <i class="fa-solid fa-shuffle" aria-hidden="true"></i>
          {{ t().result.redraw }}
        </ui-button>
        <ui-button variant="ghost" (click)="store.reset()">{{ t().result.startOver }}</ui-button>
      </div>
    </section>
  `,
})
export class ResultStep {
  protected readonly store = inject(AmistosoStore);
  private readonly i18n = inject(I18n);
  private readonly toast = inject(ToastService);

  protected readonly icons = DEFAULT_TEAM_ICONS;
  protected readonly t = computed(() => this.i18n.t().tool);
  protected readonly teams = computed(() => this.store.teams() ?? []);

  protected async copy(): Promise<void> {
    const { copied, copyFailed } = this.t().result;
    try {
      await navigator.clipboard.writeText(this.store.whatsappText());
      this.toast.show(copied);
    } catch {
      this.toast.show(copyFailed, 4000);
    }
  }
}
