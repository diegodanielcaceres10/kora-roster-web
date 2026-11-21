import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18n } from '../../i18n/i18n';
import { Entitlements } from '../../plans/entitlements';
import { FriendlyStore, Player } from '../../state/friendly.store';
import { ToastService, UiBadge, UiButton, UiCard, UiIcon, UiIconButton, UiKbd } from '../../ui';
import { StoryImagePanel } from './story-image-panel';

const PANEL = 'rounded-2xl border border-line bg-surface shadow-xs';
const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';
const TILE = 'flex items-center gap-1 rounded-xl border pr-2 transition-all duration-150';
const IDLE = 'border-line bg-surface-muted/60 hover:border-ink/20';
const SELECTED = 'border-primary bg-primary/15 ring-2 ring-primary';
const OVER = 'border-primary bg-primary/10 ring-2 ring-primary';
const DRAGGING = 'border-line bg-surface-muted/60 opacity-50';
const SLOT =
  'flex w-full select-none items-center gap-3 rounded-xl border border-dashed px-3 py-2.5 text-left text-sm transition-colors ' +
  FOCUS;
const ICON_TILE =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xl text-amber-700 dark:text-primary';

// Where a player can be dropped: on another player, on a free place of a team, or on the
// players who have no team.
type Target = { kind: 'player'; id: string } | { kind: 'team'; index: number } | { kind: 'pool' };

const keyOf = (target: Target): string =>
  target.kind === 'player' ? target.id : target.kind === 'team' ? `team-${target.index}` : 'pool';

const pad = (n: number): string => String(n).padStart(2, '0');

@Component({
  selector: 'app-result-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoryImagePanel, UiBadge, UiButton, UiCard, UiIcon, UiIconButton, UiKbd],
  template: `
    <section class="space-y-5">
      <p role="status" class="sr-only">{{ announcement() }}</p>

      @if (store.confirmed()) {
        <!-- Confirmed: the final teams, with the actions to share them -->
        <app-story-image-panel>
          <ui-button panel-start size="lg" class="col-span-2 sm:col-auto" (click)="copy()">
            <ui-icon name="message" />
            {{ t().result.copy }}
          </ui-button>
          <ui-button panel-end variant="ghost" (click)="store.reset()">
            <ui-icon name="arrow-back-up" />
            {{ t().result.startOver }}
          </ui-button>
        </app-story-image-panel>

        <div [class]="gridClass()">
          @for (team of teams(); track $index; let i = $index) {
            <ui-card [accent]="teamAccent(i)">
              <div card-header class="flex items-center gap-3">
                <span data-team-icon [class]="iconTile">{{ store.teamIcons()[i] }}</span>
                <h3
                  class="mr-auto font-display text-base font-black uppercase tracking-tight text-ink"
                >
                  {{ t().teamTitle(i + 1) }}
                </h3>
                <ui-badge data-players-badge>{{ t().result.playersBadge(team.length) }}</ui-badge>
              </div>
              <ol class="space-y-2">
                @for (player of team; track player.id; let n = $index) {
                  <li
                    class="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                    [class]="
                      player.isGoalkeeper
                        ? 'border-primary/30 bg-primary/10'
                        : 'border-transparent bg-surface-muted/60'
                    "
                  >
                    <span class="w-6 font-mono text-xs font-bold text-ink-faint">{{ pad(n + 1) }}</span>
                    <span class="flex-1 font-display font-bold text-ink">{{ player.name }}</span>
                    @if (player.isGoalkeeper) {
                      <ui-badge tone="primary">
                        <ui-icon name="glove" />
                        {{ t().preview.goalkeeper }}
                      </ui-badge>
                    }
                  </li>
                }
              </ol>
            </ui-card>
          }
        </div>
      } @else {
        <div
          data-hint
          class="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-xs"
        >
          <span [class]="iconTile + ' !size-9 !text-lg'"><ui-icon name="info-circle" /></span>
          <p class="min-w-0 flex-1 text-sm text-ink-muted">
            <strong class="font-bold text-ink">{{ t().result.hintTitle }}</strong>
            {{ manual() ? t().result.manualHint : t().result.swapHint }}
          </p>
          <span class="hidden items-center gap-2 text-xs text-ink-faint sm:flex">
            <ui-kbd>{{ t().result.escKey }}</ui-kbd>
            {{ t().result.cancelSelection }}
          </span>
        </div>

        <div class="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
          <div class="space-y-5 lg:col-span-4 lg:col-start-1 lg:row-start-1">
            @if (manual()) {
              <!-- Players without a team -->
              <section
                data-pool
                [class]="poolClass()"
                (dragover)="dragOver($event, poolTarget)"
                (dragleave)="dragLeave($event, poolTarget)"
                (drop)="drop($event, poolTarget)"
              >
                <div class="flex items-center justify-between gap-3">
                  <h3 class="flex items-center gap-2 font-display text-base font-black uppercase tracking-tight text-ink">
                    <span aria-hidden="true" class="size-2.5 rounded-full bg-primary"></span>
                    {{ t().result.poolTitle }}
                  </h3>
                  <ui-badge data-waiting tone="primary">{{ t().result.waiting(pool().length) }}</ui-badge>
                </div>

                <div
                  class="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2"
                >
                  <p data-progress aria-live="polite" class="text-sm font-medium text-ink">
                    {{ progress() }}
                  </p>
                  <span data-placed class="shrink-0 font-mono text-[11px] font-bold text-ink-muted">
                    {{ t().result.placed(placedCount(), totalPlayers()) }}
                  </span>
                </div>

                @if (pool().length > 0) {
                  <ul class="space-y-2">
                    @for (player of pool(); track player.id) {
                      <li>
                        <div [class]="tileClass(player.id)">
                          <button
                            type="button"
                            draggable="true"
                            [attr.data-player]="player.id"
                            [class]="selectClass"
                            [attr.aria-pressed]="selected() === player.id"
                            (click)="tap(player.id)"
                            (keydown.escape)="clearSelection()"
                            (dragstart)="dragStart($event, player.id)"
                            (dragover)="dragOver($event, playerTarget(player.id))"
                            (dragleave)="dragLeave($event, playerTarget(player.id))"
                            (drop)="drop($event, playerTarget(player.id))"
                            (dragend)="dragEnd()"
                          >
                            <span class="font-mono text-xs text-ink-faint">{{ numberInList(player.id) }}</span>
                            <span class="min-w-0">
                              <span class="flex items-center gap-1.5 font-display font-bold text-ink">
                                {{ player.name }}
                                @if (player.isGoalkeeper) {
                                  <ui-icon name="glove" class="text-amber-700 dark:text-primary" />
                                  <span class="sr-only">{{ t().preview.goalkeeper }}</span>
                                }
                              </span>
                              <span class="block text-xs text-ink-muted">{{ t().result.readyToPlace }}</span>
                            </span>
                          </button>
                          <ui-button
                            size="sm"
                            [ariaLabel]="t().result.placeAria(player.name)"
                            [disabled]="!hasRoom()"
                            (click)="placeInTeam(player.id)"
                          >
                            {{ t().result.place }}
                            <ui-icon name="arrow-right" />
                          </ui-button>
                          <ui-icon name="grip-vertical" class="text-ink-faint" />
                        </div>
                      </li>
                    }
                  </ul>
                }

                <ui-button variant="outline" [disabled]="pool().length === 0" (click)="drawRemaining()">
                  <ui-icon name="refresh" />
                  {{ t().result.drawRemaining }}
                </ui-button>

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

            <section data-tools [class]="panel + ' space-y-3 p-4 sm:p-5'">
              <h3 class="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                {{ t().result.toolsTitle }}
              </h3>
              <div class="grid grid-cols-2 gap-2 lg:grid-cols-1">
                <ui-button variant="outline" (click)="store.draw()">
                  <ui-icon name="arrows-shuffle" class="text-amber-700 dark:text-primary" />
                  <span class="flex-1 text-left">{{ t().result.redraw }}</span>
                  <span class="hidden font-mono text-[10px] font-bold text-ink-faint sm:inline">
                    {{ t().result.redrawNote }}
                  </span>
                </ui-button>
                @if (manual()) {
                  <ui-button variant="outline" [disabled]="allWaiting()" (click)="clearTeams()">
                    <ui-icon name="user-minus" class="text-red-600 dark:text-red-300" />
                    <span class="flex-1 text-left">{{ t().result.clearTeams }}</span>
                    <span class="hidden font-mono text-[10px] font-bold text-ink-faint sm:inline">
                      {{ t().result.clearNote }}
                    </span>
                  </ui-button>
                }
              </div>
            </section>
          </div>

          <!-- The teams -->
          <div data-teams [class]="teamsClass()">
            @for (team of teams(); track $index; let i = $index) {
              <ui-card>
                <div card-header class="flex flex-wrap items-center gap-3">
                  <span data-team-icon [class]="iconTile">{{ store.teamIcons()[i] }}</span>
                  <div class="mr-auto min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="font-display text-base font-black uppercase tracking-tight text-ink">
                        {{ t().teamTitle(i + 1) }}
                      </h3>
                      @if (goalkeepersIn(team) > 0) {
                        <ui-badge data-team-goalkeepers tone="primary">
                          <ui-icon name="glove" />
                          {{ t().result.goalkeeperCount(goalkeepersIn(team)) }}
                        </ui-badge>
                      }
                    </div>
                    <p class="text-xs text-ink-muted">{{ t().result.quota(teamSize()) }}</p>
                  </div>
                  @if (manual()) {
                    <span
                      class="rounded-lg border border-line bg-surface-muted px-2.5 py-1 font-mono text-xs font-bold text-ink-muted"
                    >
                      {{ t().result.playersOf }}
                      <span data-count [class]="team.length === teamSize() ? 'text-alternative' : 'text-amber-700 dark:text-primary'">{{ team.length }}/{{ teamSize() }}</span>
                    </span>
                  }
                </div>

                <ol class="grid gap-2 sm:grid-cols-2">
                  @for (player of team; track player.id; let n = $index) {
                    <li>
                      <div [class]="tileClass(player.id)">
                        <button
                          type="button"
                          draggable="true"
                          [attr.data-player]="player.id"
                          [class]="selectClass"
                          [attr.aria-pressed]="selected() === player.id"
                          (click)="tap(player.id)"
                          (keydown.escape)="clearSelection()"
                          (dragstart)="dragStart($event, player.id)"
                          (dragover)="dragOver($event, playerTarget(player.id))"
                          (dragleave)="dragLeave($event, playerTarget(player.id))"
                          (drop)="drop($event, playerTarget(player.id))"
                          (dragend)="dragEnd()"
                        >
                          <span class="font-mono text-xs text-ink-faint">{{ pad(n + 1) }}</span>
                          <span class="min-w-0">
                            <span class="flex flex-wrap items-center gap-1.5">
                              <span class="font-display font-bold text-ink">{{ player.name }}</span>
                              @if (player.isGoalkeeper) {
                                <ui-badge tone="primary">
                                  <ui-icon name="glove" />
                                  <span aria-hidden="true">{{ t().result.goalkeeperShort }}</span>
                                  <span class="sr-only">{{ t().preview.goalkeeper }}</span>
                                </ui-badge>
                              }
                            </span>
                            <span class="block text-xs text-ink-muted">
                              {{ player.isGoalkeeper ? t().result.roleGoalkeeper : t().result.roleField }}
                            </span>
                          </span>
                        </button>
                        @if (manual()) {
                          <ui-icon-button
                            [label]="t().result.removeFromTeam(player.name)"
                            (click)="removeFromTeam(player.id)"
                          >
                            <ui-icon name="x" />
                          </ui-icon-button>
                        }
                        <ui-icon name="grip-vertical" class="text-ink-faint" />
                      </div>
                    </li>
                  }
                  @if (manual()) {
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
                          <ui-icon name="plus" class="text-amber-700 dark:text-primary" />
                          <span class="min-w-0 flex-1">
                            <span class="block font-semibold">{{ t().result.freeSlot }}</span>
                            <span class="block text-xs">{{ t().result.freeSlotHint }}</span>
                          </span>
                          <span
                            class="rounded-md border border-line bg-surface px-2 py-1 font-mono text-[10px] font-bold uppercase text-ink-muted"
                          >
                            {{ t().result.placeHere }}
                          </span>
                        </button>
                      </li>
                    }
                  }
                </ol>
              </ui-card>
            }
          </div>

          <div class="space-y-3 lg:col-span-4 lg:col-start-1 lg:row-start-2">
            <ui-button size="lg" [disabled]="!store.isComplete()" (click)="confirm()">
              <ui-icon name="check" />
              {{ t().result.confirm }}
            </ui-button>
            @if (!store.isComplete()) {
              <p data-confirm-hint class="flex items-start justify-center gap-1.5 text-center text-xs text-ink-muted">
                <ui-icon name="lock" class="mt-0.5 shrink-0" />
                {{ t().result.confirmLocked(pool().length) }}
              </p>
            }
            <ui-button size="sm" variant="ghost" (click)="store.back()">
              <ui-icon name="arrow-left" />
              {{ t().result.backToReview }}
            </ui-button>
          </div>
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
  protected readonly panel = PANEL;
  protected readonly iconTile = ICON_TILE;
  protected readonly selectClass = `flex min-w-0 flex-1 select-none items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${FOCUS}`;
  protected readonly pad = pad;
  protected readonly teams = computed(() => this.store.teams() ?? []);
  protected readonly pool = computed(() => this.store.pool());
  // Building the teams by hand is for people with an account. Without one the screen only
  // swaps players, as it always did.
  protected readonly manual = computed(() => this.entitlements.manualLock() === null);
  // The confirmed teams side by side; the editor stacks them in its own column.
  protected readonly gridClass = computed(() =>
    this.teams().length === 3
      ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid grid-cols-1 gap-4 sm:grid-cols-2',
  );
  protected readonly teamsClass = computed(() => {
    const base = 'grid grid-cols-1 gap-5 lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1';
    return this.teams().length > 2 ? `${base} 2xl:grid-cols-2` : base;
  });
  // Places in each team, which is the same for all of them.
  protected readonly teamSize = computed(() => this.store.teamSize() ?? 0);
  protected readonly totalPlayers = computed(() => this.store.players().length);
  protected readonly placedCount = computed(() => this.totalPlayers() - this.pool().length);
  protected readonly hasRoom = computed(() => this.teams().some((team) => team.length < this.teamSize()));
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
      'primary',
      'secondary',
      'alternative',
    ];
    return accents[index % accents.length];
  }

  protected tileClass(id: string): string {
    const state =
      this.selected() === id
        ? SELECTED
        : this.over() === id
          ? OVER
          : this.draggingId() === id
            ? DRAGGING
            : IDLE;
    return `${TILE} ${state}`;
  }

  protected slotClass(team: number): string {
    const state =
      this.over() === `team-${team}`
        ? 'border-primary bg-primary/10 text-ink ring-2 ring-primary'
        : 'border-ink/25 text-ink-muted hover:bg-ink/5';
    return `${SLOT} ${state}`;
  }

  protected poolClass(): string {
    const state = this.over() === 'pool' ? 'border-primary bg-primary/5' : 'border-line';
    return `${PANEL} space-y-4 border-2 border-dashed p-4 transition-colors sm:p-5 ${state}`;
  }

  protected poolTargetClass(): string {
    return `flex min-h-11 w-full select-none items-center justify-center rounded-xl border border-dashed border-ink/25 px-3 text-center text-sm text-ink-muted transition-colors enabled:hover:bg-ink/5 disabled:cursor-default ${FOCUS}`;
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

  // The number the player has in the list that was pasted.
  protected numberInList(id: string): string {
    return pad(this.store.players().findIndex((p) => p.id === id) + 1);
  }

  protected goalkeepersIn(team: Player[]): number {
    return team.filter((p) => p.isGoalkeeper).length;
  }

  // Puts a player who has no team in the first team that still has room.
  protected placeInTeam(id: string): void {
    const index = this.teams().findIndex((team) => team.length < this.teamSize());
    if (index >= 0) this.move(id, index);
  }

  protected removeFromTeam(id: string): void {
    this.move(id, 'pool');
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
