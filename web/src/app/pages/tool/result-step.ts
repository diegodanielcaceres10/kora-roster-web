import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18n } from '../../i18n/i18n';
import { AmistosoStore } from '../../state/amistoso.store';
import { ToastService, UiButton, UiCard } from '../../ui';
import { StoryImagePanel } from './story-image-panel';

const ROW =
  'flex w-full select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-all duration-150 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary';
const IDLE = 'hover:bg-secondary/5 border border-transparent hover:border-secondary/10';
const SELECTED = 'bg-primary/30 font-semibold ring-2 ring-primary';
const OVER = 'bg-secondary/5 ring-2 ring-primary border-primary';
const DRAGGING = 'opacity-50';

@Component({
  selector: 'app-result-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoryImagePanel, UiButton, UiCard],
  template: `
    <section class="space-y-6">
      <!-- Result Step Header & Swap Guidance -->
      <div class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-secondary/10 pb-3">
          <h2>{{ t().result.title }}</h2>
          <span class="rounded-full bg-alternative/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-alternative">
            {{ teams().length }} equipos equilibrados
          </span>
        </div>

        <div class="flex items-center gap-2.5 rounded-xl border border-secondary/12 bg-white p-3 text-xs text-secondary/80 shadow-xs">
          <i class="fa-solid fa-arrows-rotate text-primary text-sm shrink-0" aria-hidden="true"></i>
          <p class="text-sm text-secondary/80">{{ t().result.swapHint }}</p>
        </div>
      </div>

      <p role="status" class="sr-only">{{ announcement() }}</p>

      <!-- Team Roster Lineup Cards Grid -->
      <div [class]="gridClass()">
        @for (team of teams(); track $index; let i = $index) {
          <ui-card [accent]="teamAccent(i)">
            <h3 card-header>{{ store.teamIcons()[i] }} {{ t().teamTitle(i + 1) }}</h3>

            <ol class="space-y-1 pt-1">
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
                    <span class="w-6 text-right font-bold text-secondary/50 tabular-nums">{{ n + 1 }}.</span>
                    <span class="flex-1 font-medium text-secondary">{{ player.name }}</span>
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

      <!-- Tactical WhatsApp Text Panel -->
      <div class="rounded-xl border border-secondary/12 bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <div class="flex items-center justify-between border-b border-secondary/10 pb-2.5">
          <h3 class="text-sm font-bold uppercase tracking-wider text-secondary">
            {{ t().result.whatsappTitle }}
          </h3>
          <span class="text-xs text-secondary/60">Formato listo para compartir</span>
        </div>

        <pre
          class="overflow-x-auto whitespace-pre-wrap rounded-xl border border-secondary/15 bg-secondary/[0.04] p-4 text-xs sm:text-sm font-mono text-secondary leading-relaxed shadow-inner"
        >{{ store.whatsappText() }}</pre>
      </div>

      <!-- Quick Actions Bar -->
      <div class="flex flex-wrap items-center gap-3 rounded-xl border border-secondary/10 bg-white p-4 shadow-xs">
        <ui-button size="lg" (click)="copy()">
          <i class="fa-solid fa-copy" aria-hidden="true"></i>
          {{ t().result.copy }}
        </ui-button>
        <ui-button variant="outline" (click)="store.draw()">
          <i class="fa-solid fa-shuffle" aria-hidden="true"></i>
          {{ t().result.redraw }}
        </ui-button>
        <ui-button variant="ghost" (click)="store.reset()">
          <i class="fa-solid fa-rotate-left" aria-hidden="true"></i>
          {{ t().result.startOver }}
        </ui-button>
      </div>

      <!-- Story Image Generator Panel -->
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
      ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid grid-cols-1 gap-4 sm:grid-cols-2',
  );

  private readonly selection = signal<{ id: string; teams: unknown } | null>(null);
  private readonly draggingId = signal<string | null>(null);
  private readonly overId = signal<string | null>(null);
  private readonly note = signal<{ text: string; teams: unknown } | null>(null);

  protected readonly selected = computed(() => {
    const selection = this.selection();
    return selection && selection.teams === this.store.teams() ? selection.id : null;
  });
  protected readonly announcement = computed(() => {
    const note = this.note();
    return note && note.teams === this.store.teams() ? note.text : '';
  });

  protected teamAccent(index: number): 'primary' | 'secondary' | 'alternative' | undefined {
    const accents: ('primary' | 'secondary' | 'alternative')[] = [
      'secondary',
      'alternative',
      'primary',
    ];
    return accents[index % accents.length];
  }

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
