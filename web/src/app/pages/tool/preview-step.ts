import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { MAX_PLAYERS, MIN_PLAYERS } from '../../core/draw-teams';
import { I18n } from '../../i18n/i18n';
import { AmistosoStore } from '../../state/amistoso.store';
import { UiBadge, UiButton, UiIconButton, UiListRow } from '../../ui';

@Component({
  selector: 'app-preview-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiBadge, UiButton, UiIconButton, UiListRow],
  template: `
    <section class="space-y-4">
      <h2>{{ t().preview.title }}</h2>

      <div>
        <p class="font-semibold">{{ t().preview.count(store.playerCount()) }}</p>
        <p role="status" [class]="statusClass()">{{ status() }}</p>
      </div>

      <div role="list" class="space-y-1">
        @for (player of store.players(); track player.id; let i = $index) {
          <ui-list-row>
            <span row-start class="inline-block w-6 text-right font-semibold">{{ i + 1 }}</span>
            @if (editingId() === player.id) {
              <input
                #editor
                type="text"
                class="w-full rounded-lg border border-secondary/30 bg-white px-3 py-2 text-base text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                [attr.aria-label]="t().preview.nameLabel"
                [value]="player.name"
                (keydown.enter)="save(player.id, editor.value)"
                (keydown.escape)="cancel()"
                (blur)="save(player.id, editor.value)"
              />
            } @else {
              <div class="flex flex-wrap items-center gap-2">
                <span>{{ player.name }}</span>
                @if (player.isGoalkeeper) {
                  <ui-badge tone="alternative">{{ t().preview.goalkeeper }}</ui-badge>
                }
              </div>
            }
            <ui-icon-button
              row-end
              [label]="
                player.isGoalkeeper
                  ? t().preview.unmarkGoalkeeper(player.name)
                  : t().preview.markGoalkeeper(player.name)
              "
              [pressed]="player.isGoalkeeper"
              (click)="store.toggleGoalkeeper(player.id)"
            >
              <i class="fa-solid fa-mitten" aria-hidden="true"></i>
            </ui-icon-button>
            <ui-icon-button
              row-end
              [label]="t().preview.edit(player.name)"
              (click)="startEdit(player.id)"
            >
              <i class="fa-solid fa-pencil" aria-hidden="true"></i>
            </ui-icon-button>
            <ui-icon-button
              row-end
              variant="danger"
              [label]="t().preview.remove(player.name)"
              (click)="store.removePlayer(player.id)"
            >
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </ui-icon-button>
          </ui-list-row>
        }
      </div>

      <div class="flex flex-wrap gap-3">
        <ui-button variant="outline" (click)="store.back()">{{ t().preview.back }}</ui-button>
        <ui-button size="lg" [disabled]="!store.canDraw()" (click)="store.draw()">
          {{ t().preview.draw }}
        </ui-button>
      </div>
    </section>
  `,
})
export class PreviewStep {
  protected readonly store = inject(AmistosoStore);
  private readonly i18n = inject(I18n);
  private readonly injector = inject(Injector);

  protected readonly t = computed(() => this.i18n.t().tool);
  protected readonly editingId = signal<string | null>(null);
  private readonly editor = viewChild<ElementRef<HTMLInputElement>>('editor');

  protected readonly status = computed(() => {
    const { status } = this.t().preview;
    const count = this.store.playerCount();
    switch (this.store.countError()) {
      case 'too-few':
        return status.tooFew(MIN_PLAYERS - count);
      case 'too-many':
        return status.tooMany(count - MAX_PLAYERS);
      case 'odd':
        return status.odd(count);
      default:
        return status.ok;
    }
  });

  protected readonly statusClass = computed(() =>
    this.store.canDraw() ? 'text-alternative' : 'text-red-700',
  );

  protected startEdit(id: string): void {
    this.editingId.set(id);
    afterNextRender(
      () => {
        const input = this.editor()?.nativeElement;
        input?.focus();
        input?.select();
      },
      { injector: this.injector },
    );
  }

  // Enter and blur both save. Closing the field after Escape can fire a blur too,
  // which must not save, so only the row that is still being edited is saved.
  protected save(id: string, value: string): void {
    if (this.editingId() !== id) return;
    this.store.renamePlayer(id, value);
    this.editingId.set(null);
  }

  protected cancel(): void {
    this.editingId.set(null);
  }
}
