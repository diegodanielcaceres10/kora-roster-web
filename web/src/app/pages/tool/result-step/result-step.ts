import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18n } from '../../../i18n/i18n';
import { Entitlements } from '../../../plans/entitlements';
import { FriendlyStore, Player } from '../../../state/friendly.store';
import { Toast, UiBadge, UiButton, UiCard, UiIcon, UiIconButton, UiKbd } from '../../../ui';
import { StoryImagePanel } from '../story-image-panel/story-image-panel';

const PANEL = 'rounded-2xl border border-line bg-surface shadow-xs';
const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';
const TILE = 'flex min-h-14 items-center gap-1 rounded-xl border pr-2 transition-all duration-150';
const IDLE = 'border-line bg-surface-muted/60 hover:border-ink/20';
const SELECTED = 'border-primary bg-primary/15 ring-2 ring-primary';
const OVER = 'border-primary bg-primary/10 ring-2 ring-primary';
const DRAGGING = 'border-line bg-surface-muted/60 opacity-50';
const SLOT =
  'flex min-h-14 w-full select-none items-center gap-3 rounded-xl border border-dashed px-3 py-2 text-left text-sm transition-colors ' +
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
  templateUrl: './result-step.html',
})
export class ResultStep {
  protected readonly store = inject(FriendlyStore);
  private readonly i18n = inject(I18n);
  private readonly toast = inject(Toast);
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
  protected readonly gridClass = computed(() => 'grid grid-cols-1 gap-4');
  protected readonly teamsClass = computed(() => {
    const base = 'grid grid-cols-1 gap-5 lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1';
    return base;
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
