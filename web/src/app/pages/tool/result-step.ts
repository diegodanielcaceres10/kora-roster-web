import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18n } from '../../i18n/i18n';
import { Entitlements } from '../../plans/entitlements';
import { FriendlyStore, Player } from '../../state/friendly.store';
import { ToastService, UiButton, UiCard } from '../../ui';
import { StoryImagePanel } from './story-image-panel';

const ROW =
  'flex w-full select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-all duration-150 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary';
const IDLE = 'hover:bg-secondary/5 border border-transparent hover:border-secondary/10';
const SELECTED = 'bg-primary/30 font-semibold ring-2 ring-primary';
const OVER = 'bg-secondary/5 ring-2 ring-primary border-primary';
const DRAGGING = 'opacity-50';
const SLOT = 'border-dashed border-secondary/25 text-secondary/60 hover:bg-secondary/5';

// Where a player can be dropped: on another player, on a free place of a team, or on the
// players who have no team.
type Target = { kind: 'player'; id: string } | { kind: 'team'; index: number } | { kind: 'pool' };

const keyOf = (target: Target): string =>
  target.kind === 'player' ? target.id : target.kind === 'team' ? `team-${target.index}` : 'pool';

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

        @if (!store.confirmed()) {
          <div class="flex items-center gap-2.5 rounded-xl border border-secondary/12 bg-white p-3 text-xs text-secondary/80 shadow-xs">
            <i class="fa-solid fa-arrows-rotate text-primary text-sm shrink-0" aria-hidden="true"></i>
            <p class="text-sm text-secondary/80">
              {{ manual() ? t().result.manualHint : t().result.swapHint }}
            </p>
          </div>
        }
      </div>

      <p role="status" class="sr-only">{{ announcement() }}</p>

      <!-- Players without a team -->
      @if (manual() && !store.confirmed()) {
        <section
          data-pool
          [class]="poolClass()"
          (dragover)="dragOver($event, poolTarget)"
          (dragleave)="dragLeave($event, poolTarget)"
          (drop)="drop($event, poolTarget)"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h3
              class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-secondary"
            >
              {{ t().result.poolTitle }}
              <span class="rounded-full bg-secondary/10 px-2 py-0.5 text-xs tabular-nums">{{
                pool().length
              }}</span>
            </h3>
            <ui-button variant="outline" [disabled]="pool().length === 0" (click)="drawRemaining()">
              <i class="fa-solid fa-shuffle" aria-hidden="true"></i>
              {{ t().result.drawRemaining }}
            </ui-button>
          </div>

          <p data-progress aria-live="polite" class="text-sm font-medium text-secondary/80">
            {{ progress() }}
          </p>

          @if (pool().length > 0) {
            <ul class="grid gap-1 sm:grid-cols-2">
              @for (player of pool(); track player.id) {
                <li>
                  <button
                    type="button"
                    draggable="true"
                    [attr.data-player]="player.id"
                    [class]="playerClass(player.id)"
                    [attr.aria-pressed]="selected() === player.id"
                    (click)="tap(player.id)"
                    (keydown.escape)="clearSelection()"
                    (dragstart)="dragStart($event, player.id)"
                    (dragover)="dragOver($event, playerTarget(player.id))"
                    (dragleave)="dragLeave($event, playerTarget(player.id))"
                    (drop)="drop($event, playerTarget(player.id))"
                    (dragend)="dragEnd()"
                  >
                    <span class="flex-1 font-medium text-secondary">{{ player.name }}</span>
                    @if (player.isGoalkeeper) {
                      <i class="fa-solid fa-mitten text-alternative" aria-hidden="true"></i>
                      <span class="sr-only">{{ t().preview.goalkeeper }}</span>
                    }
                  </button>
                </li>
              }
            </ul>
          }

          <button
            type="button"
            data-pool-target
            [class]="poolTargetClass()"
            [disabled]="!canSendToPool()"
            (click)="sendToPool()"
          >
            {{ poolTargetText() }}
          </button>
        </section>
      }

      <!-- Team Roster Lineup Cards Grid -->
      <div [class]="gridClass()">
        @for (team of teams(); track $index; let i = $index) {
          <ui-card [accent]="teamAccent(i)">
            <div card-header class="flex items-center justify-between gap-2">
              <h3>{{ store.teamIcons()[i] }} {{ t().teamTitle(i + 1) }}</h3>
              @if (manual() && !store.confirmed()) {
                <span
                  data-count
                  class="rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-bold tabular-nums text-secondary"
                >
                  {{ team.length }}/{{ store.teamSize() }}
                </span>
              }
            </div>

            <ol class="space-y-1 pt-1">
              @for (player of team; track player.id; let n = $index) {
                @if (store.confirmed()) {
                  <li class="flex items-center gap-2.5 px-2.5 py-2 text-sm">
                    <span class="w-6 text-right font-bold text-secondary/50 tabular-nums">{{ n + 1 }}.</span>
                    <span class="flex-1 font-medium text-secondary">{{ player.name }}</span>
                    @if (player.isGoalkeeper) {
                      <i class="fa-solid fa-mitten text-alternative" aria-hidden="true"></i>
                      <span class="sr-only">{{ t().preview.goalkeeper }}</span>
                    }
                  </li>
                } @else {
                  <li>
                    <button
                      type="button"
                      draggable="true"
                      [attr.data-player]="player.id"
                      [class]="playerClass(player.id)"
                      [attr.aria-pressed]="selected() === player.id"
                      (click)="tap(player.id)"
                      (keydown.escape)="clearSelection()"
                      (dragstart)="dragStart($event, player.id)"
                      (dragover)="dragOver($event, playerTarget(player.id))"
                      (dragleave)="dragLeave($event, playerTarget(player.id))"
                      (drop)="drop($event, playerTarget(player.id))"
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
              }
              @if (manual() && !store.confirmed()) {
                @for (slot of freeSlots(team); track $index) {
                  <li>
                    <button
                      type="button"
                      data-free-slot
                      [class]="slotClass(i)"
                      [attr.aria-label]="slotLabel(i)"
                      (click)="tapSlot(i)"
                      (dragover)="dragOver($event, teamTarget(i))"
                      (dragleave)="dragLeave($event, teamTarget(i))"
                      (drop)="drop($event, teamTarget(i))"
                    >
                      <i class="fa-solid fa-plus w-6 text-center text-xs" aria-hidden="true"></i>
                      <span class="flex-1">{{ t().result.freeSlot }}</span>
                    </button>
                  </li>
                }
              }
            </ol>
          </ui-card>
        }
      </div>

      @if (store.confirmed()) {
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
      }

      @if (store.confirmed()) {
        <!-- Final actions, with the story image generator -->
        <app-story-image-panel>
          <ui-button size="lg" (click)="copy()">
            <i class="fa-solid fa-copy" aria-hidden="true"></i>
            {{ t().result.copy }}
          </ui-button>
          <ui-button variant="ghost" (click)="store.reset()">
            <i class="fa-solid fa-rotate-left" aria-hidden="true"></i>
            {{ t().result.startOver }}
          </ui-button>
        </app-story-image-panel>
      } @else {
        <!-- Quick Actions Bar -->
        <div class="flex flex-wrap items-center gap-3 rounded-xl border border-secondary/10 bg-white p-4 shadow-xs">
          <ui-button size="lg" [disabled]="!store.isComplete()" (click)="confirm()">
            <i class="fa-solid fa-check" aria-hidden="true"></i>
            {{ t().result.confirm }}
          </ui-button>
          <ui-button variant="outline" (click)="store.draw()">
            <i class="fa-solid fa-shuffle" aria-hidden="true"></i>
            {{ t().result.redraw }}
          </ui-button>
          @if (manual()) {
            <ui-button variant="outline" [disabled]="allWaiting()" (click)="clearTeams()">
              <i class="fa-solid fa-user-minus" aria-hidden="true"></i>
              {{ t().result.clearTeams }}
            </ui-button>
          }
          <ui-button variant="outline" (click)="store.back()">
            <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
            {{ t().preview.back }}
          </ui-button>
        </div>
      }
    </section>
  `,
})
export class ResultStep {
  protected readonly store = inject(FriendlyStore);
  private readonly i18n = inject(I18n);
  private readonly toast = inject(ToastService);
  private readonly entitlements = inject(Entitlements);

  protected readonly t = computed(() => this.i18n.t().tool);
  protected readonly teams = computed(() => this.store.teams() ?? []);
  protected readonly pool = computed(() => this.store.pool());
  // Building the teams by hand is for people with an account. Without one the screen only
  // swaps players, as it always did.
  protected readonly manual = computed(() => this.entitlements.manualLock() === null);
  protected readonly gridClass = computed(() =>
    this.teams().length === 3
      ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid grid-cols-1 gap-4 sm:grid-cols-2',
  );
  protected readonly progress = computed(() =>
    this.store.isComplete()
      ? this.t().result.complete
      : this.t().result.missing(this.pool().length),
  );
  protected readonly allWaiting = computed(() => this.teams().every((team) => team.length === 0));

  protected readonly poolTarget: Target = { kind: 'pool' };

  // A move or a swap always makes a new list of teams, so what depends on the teams as they
  // were is dropped by comparing against the current one.
  private readonly selection = signal<{ id: string; teams: unknown } | null>(null);
  private readonly draggingId = signal<string | null>(null);
  private readonly over = signal<string | null>(null);
  private readonly note = signal<{ text: string; teams: unknown } | null>(null);

  protected readonly selected = computed(() => {
    const selection = this.selection();
    return selection && selection.teams === this.store.teams() ? selection.id : null;
  });
  protected readonly announcement = computed(() => {
    const note = this.note();
    return note && note.teams === this.store.teams() ? note.text : '';
  });
  // The selected player can be taken out of their team unless they have none already.
  protected readonly canSendToPool = computed(() => {
    const id = this.selected();
    return id !== null && this.placeOf(id) !== this.teams().length;
  });
  protected readonly poolTargetText = computed(() => {
    const id = this.selected();
    const { poolDrop, poolHint } = this.t().result;
    return this.canSendToPool() && id !== null ? poolDrop(this.nameOf(id)) : poolHint;
  });

  protected playerTarget(id: string): Target {
    return { kind: 'player', id };
  }

  protected teamTarget(index: number): Target {
    return { kind: 'team', index };
  }

  protected freeSlots(team: Player[]): number[] {
    const missing = Math.max(0, (this.store.teamSize() ?? team.length) - team.length);
    return Array.from({ length: missing }, (_, i) => i);
  }

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
        : this.over() === id
          ? OVER
          : this.draggingId() === id
            ? DRAGGING
            : IDLE;
    return `${ROW} ${state}`;
  }

  protected slotClass(team: number): string {
    return `${ROW} border ${this.over() === `team-${team}` ? OVER : SLOT}`;
  }

  protected poolClass(): string {
    const base =
      'space-y-3 rounded-xl border-2 border-dashed bg-white p-4 shadow-xs transition-colors sm:p-5';
    return `${base} ${this.over() === 'pool' ? 'border-primary bg-primary/5' : 'border-secondary/20'}`;
  }

  protected poolTargetClass(): string {
    return `${ROW} justify-center border border-dashed border-secondary/25 text-secondary/70 enabled:hover:bg-secondary/5 disabled:cursor-default`;
  }

  protected slotLabel(team: number): string {
    const { freeSlot, moveHere } = this.t().result;
    const title = this.t().teamTitle(team + 1);
    const id = this.selected();
    return id === null ? `${freeSlot}, ${title}` : moveHere(this.nameOf(id), title);
  }

  protected tap(id: string): void {
    const current = this.selected();
    if (current === null) return this.select(id);
    if (current === id) return this.clearSelection();
    if (this.placeOf(current) === this.placeOf(id)) return this.select(id);
    this.swap(current, id);
  }

  protected tapSlot(team: number): void {
    const current = this.selected();
    if (current === null || this.placeOf(current) === team) return;
    this.move(current, team);
  }

  protected sendToPool(): void {
    const current = this.selected();
    if (current !== null && this.canSendToPool()) this.move(current, 'pool');
  }

  protected clearSelection(): void {
    this.selection.set(null);
    this.note.set(null);
  }

  protected drawRemaining(): void {
    this.store.drawRemaining();
    this.say(this.t().result.remainingDrawn);
  }

  protected confirm(): void {
    this.store.confirm();
    this.say(this.t().result.confirmed);
  }

  protected clearTeams(): void {
    this.store.clearTeams();
    this.say(this.t().result.teamsCleared);
  }

  protected dragStart(event: DragEvent, id: string): void {
    this.draggingId.set(id);
    event.dataTransfer?.setData('text/plain', id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  protected dragOver(event: DragEvent, target: Target): void {
    // An element inside another one that also takes drops has already answered.
    if (event.defaultPrevented || !this.canDropOn(target)) return;
    event.preventDefault();
    this.over.set(keyOf(target));
  }

  protected dragLeave(event: DragEvent, target: Target): void {
    const next = event.relatedTarget;
    if (next instanceof Node && (event.currentTarget as Node).contains(next)) return;
    if (this.over() === keyOf(target)) this.over.set(null);
  }

  protected drop(event: DragEvent, target: Target): void {
    const from = this.draggingId();
    const accepted = this.canDropOn(target);
    this.dragEnd();
    if (!accepted || from === null) return;
    event.preventDefault();
    if (target.kind === 'player') this.swap(from, target.id);
    else this.move(from, target.kind === 'team' ? target.index : 'pool');
  }

  protected dragEnd(): void {
    this.draggingId.set(null);
    this.over.set(null);
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
    const { selected, selectedManual } = this.t().result;
    this.selection.set({ id, teams: this.store.teams() });
    this.say((this.manual() ? selectedManual : selected)(this.nameOf(id)));
  }

  private swap(a: string, b: string): void {
    const names = [this.nameOf(a), this.nameOf(b)];
    this.store.swapPlayers(a, b);
    this.selection.set(null);
    this.say(this.t().result.swapped(names[0], names[1]));
  }

  // The store ignores a move it does not accept, and then nothing is announced.
  private move(id: string, to: number | 'pool'): void {
    const name = this.nameOf(id);
    const before = this.placeOf(id);
    this.store.movePlayer(id, to);
    if (this.placeOf(id) === before) return;
    this.selection.set(null);
    const { moved, leftTeam } = this.t().result;
    this.say(to === 'pool' ? leftTeam(name) : moved(name, this.t().teamTitle(to + 1)));
  }

  private say(text: string): void {
    this.note.set({ text, teams: this.store.teams() });
  }

  private canDropOn(target: Target): boolean {
    const from = this.draggingId();
    if (from === null) return false;
    const place = this.placeOf(from);
    if (target.kind === 'player') return place !== this.placeOf(target.id);
    if (target.kind === 'team') return place !== target.index;
    return place !== this.teams().length;
  }

  // The number of the team the player is in, or the number after the last team for those
  // who have none.
  private placeOf(id: string): number {
    const team = this.teams().findIndex((members) => members.some((p) => p.id === id));
    if (team >= 0) return team;
    return this.pool().some((p) => p.id === id) ? this.teams().length : -1;
  }

  private nameOf(id: string): string {
    return [...this.teams().flat(), ...this.pool()].find((p) => p.id === id)?.name ?? '';
  }
}
