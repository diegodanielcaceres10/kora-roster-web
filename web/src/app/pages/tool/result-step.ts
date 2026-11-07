import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18n } from '../../i18n/i18n';
import { AmistosoStore } from '../../state/amistoso.store';
import { ToastService, UiButton, UiCard } from '../../ui';
import { StoryImagePanel } from './story-image-panel';

const ROW =
  'flex w-full items-center gap-2 rounded-md px-1 py-1 text-left transition ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary';
const IDLE = 'hover:bg-secondary/5';
const SELECTED = 'bg-primary/40 font-semibold';
const OVER = 'bg-secondary/5 ring-2 ring-primary';
const DRAGGING = 'opacity-50';

@Component({
  selector: 'app-result-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoryImagePanel, UiButton, UiCard],
  template: `
    <section class="space-y-4">
      <h2>{{ t().result.title }}</h2>
      <p class="text-sm text-secondary/80">{{ t().result.swapHint }}</p>
      <p role="status" class="sr-only">{{ announcement() }}</p>

      <div [class]="gridClass()">
        @for (team of teams(); track $index; let i = $index) {
          <ui-card>
            <h3 card-header>{{ store.teamIcons()[i] }} {{ t().teamTitle(i + 1) }}</h3>
            <ol class="space-y-1">
              @for (player of team; track player.id; let n = $index) {
                <li>
                  <button
                    type="button"
                    draggable="true"
                    [class]="playerClass(player.id)"
                    [attr.aria-pressed]="selected() === player.id"
                    (click)="tap(player.id)"
                    (keydown.escape)="clearSelection()"
                    (dragstart)="dragStart($event, player.id)"
                    (dragover)="dragOver($event, player.id)"
                    (dragleave)="dragLeave(player.id)"
                    (drop)="drop($event, player.id)"
                    (dragend)="dragEnd()"
                  >
                    <span class="w-6 text-right font-semibold">{{ n + 1 }}.</span>
                    <span>{{ player.name }}</span>
                    @if (player.isGoalkeeper) {
                      <i class="fa-solid fa-mitten text-alternative" aria-hidden="true"></i>
                      <span class="sr-only">{{ t().preview.goalkeeper }}</span>
                    }
                  </button>
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

      <app-story-image-panel />
    </section>
  `,
})
export class ResultStep {
  protected readonly store = inject(AmistosoStore);
  private readonly i18n = inject(I18n);
  private readonly toast = inject(ToastService);

  protected readonly t = computed(() => this.i18n.t().tool);
  protected readonly teams = computed(() => this.store.teams() ?? []);
  protected readonly gridClass = computed(() =>
    this.teams().length === 3
      ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid grid-cols-1 gap-3 sm:grid-cols-2',
  );

  // The selection belongs to the teams it was made on, so a new draw never keeps it.
  private readonly selection = signal<{ id: string; teams: unknown } | null>(null);
  private readonly draggingId = signal<string | null>(null);
  private readonly overId = signal<string | null>(null);
  // The last thing said to assistive technology, kept only while the teams are the same
  // ones it was said about, so a new draw never leaves an old message behind.
  private readonly note = signal<{ text: string; teams: unknown } | null>(null);

  protected readonly selected = computed(() => {
    const selection = this.selection();
    return selection && selection.teams === this.store.teams() ? selection.id : null;
  });
  protected readonly announcement = computed(() => {
    const note = this.note();
    return note && note.teams === this.store.teams() ? note.text : '';
  });

  protected playerClass(id: string): string {
    const state =
      this.selected() === id
        ? SELECTED
        : this.overId() === id
          ? OVER
          : this.draggingId() === id
            ? DRAGGING
            : IDLE;
    return `${ROW} ${state}`;
  }

  // Tap one player, then a player of another team, to swap them.
  protected tap(id: string): void {
    const current = this.selected();
    if (current === null) return this.select(id);
    if (current === id) return this.clearSelection();
    if (this.owner(current) === this.owner(id)) return this.select(id);
    this.swap(current, id);
  }

  protected clearSelection(): void {
    this.selection.set(null);
    this.note.set(null);
  }

  protected dragStart(event: DragEvent, id: string): void {
    this.draggingId.set(id);
    event.dataTransfer?.setData('text/plain', id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  // Only a player of another team accepts the drop.
  protected dragOver(event: DragEvent, id: string): void {
    if (!this.canDropOn(id)) return;
    event.preventDefault();
    this.overId.set(id);
  }

  protected dragLeave(id: string): void {
    if (this.overId() === id) this.overId.set(null);
  }

  protected drop(event: DragEvent, id: string): void {
    const from = this.draggingId();
    const accepted = this.canDropOn(id);
    this.dragEnd();
    if (!accepted || from === null) return;
    event.preventDefault();
    this.swap(from, id);
  }

  protected dragEnd(): void {
    this.draggingId.set(null);
    this.overId.set(null);
  }

  protected async copy(): Promise<void> {
    const { copied, copyFailed } = this.t().result;
    try {
      await navigator.clipboard.writeText(this.store.whatsappText());
      this.toast.show(copied);
    } catch {
      this.toast.show(copyFailed, 4000);
    }
  }

  private select(id: string): void {
    this.selection.set({ id, teams: this.store.teams() });
    this.say(this.t().result.selected(this.nameOf(id)));
  }

  private swap(a: string, b: string): void {
    const names = [this.nameOf(a), this.nameOf(b)];
    this.store.swapPlayers(a, b);
    this.selection.set(null);
    this.say(this.t().result.swapped(names[0], names[1]));
  }

  private say(text: string): void {
    this.note.set({ text, teams: this.store.teams() });
  }

  private canDropOn(id: string): boolean {
    const from = this.draggingId();
    return from !== null && this.owner(from) !== this.owner(id);
  }

  private owner(id: string): number {
    return this.teams().findIndex((team) => team.some((p) => p.id === id));
  }

  private nameOf(id: string): string {
    return (
      this.teams()
        .flat()
        .find((p) => p.id === id)?.name ?? ''
    );
  }
}
