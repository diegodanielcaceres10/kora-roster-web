import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { playerRange } from '../../core/draw-teams';
import { I18n } from '../../i18n/i18n';
import { Entitlements, LockReason } from '../../plans/entitlements';
import { LockNotice } from '../../plans/lock-notice';
import { AmistosoStore, Player } from '../../state/amistoso.store';
import {
  SegmentedOption,
  UiBadge,
  UiButton,
  UiCard,
  UiIconButton,
  UiInput,
  UiListRow,
  UiSegmented,
} from '../../ui';

@Component({
  selector: 'app-preview-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LockNotice, UiBadge, UiButton, UiCard, UiIconButton, UiInput, UiListRow, UiSegmented],
  template: `
    <section class="space-y-6">
      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <!-- Match Setup & Status Control Panel (Desktop Sticky Sidebar) -->
        <aside class="space-y-5 lg:col-span-4 lg:sticky lg:top-20">
          <ui-card accent="primary">
            <h3 card-header class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary/80">
              <i class="fa-solid fa-sliders text-primary" aria-hidden="true"></i>
              Configuración de partido
            </h3>

            <div class="space-y-4">
              <!-- Team Count Selector -->
              <div class="space-y-2">
                <span class="block text-xs font-bold uppercase tracking-wider text-secondary/70">
                  {{ t().preview.teamsLabel }}
                </span>
                <ui-segmented
                  [label]="t().preview.teamsLabel"
                  [options]="teamOptions()"
                  [value]="teamValue()"
                  (valueChange)="chooseTeams($event)"
                  (lockedSelect)="touchLocked($event)"
                />
                <app-lock-notice [reason]="lock()?.reason ?? null" [message]="lock()?.message ?? null" />
              </div>

              <!-- Status Banner -->
              <div class="rounded-xl border border-secondary/10 bg-secondary/[0.03] p-3.5 space-y-2">
                <div class="flex items-center justify-between">
                  <p class="font-black text-lg text-secondary">{{ t().preview.count(store.playerCount()) }}</p>
                  <span class="text-xs font-semibold text-secondary/60 tabular-nums">
                    {{ store.teamCount() }} equipos
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <span
                    class="size-2 rounded-full"
                    [class.bg-alternative]="store.canDraw()"
                    [class.bg-red-600]="!store.canDraw()"
                  ></span>
                  <p role="status" [class]="statusClass()" class="text-xs font-bold uppercase tracking-wide">
                    {{ status() }}
                  </p>
                </div>

                @if (notice(); as message) {
                  <p class="mt-1 rounded bg-secondary/8 p-2 text-xs text-secondary/80">{{ message }}</p>
                }
              </div>

              <!-- Tactical Metrics Summary -->
              <div class="grid grid-cols-2 gap-2 text-center">
                <div class="rounded-lg border border-secondary/10 bg-white p-2.5 shadow-xs">
                  <span class="block text-[10px] font-bold uppercase tracking-wider text-secondary/60">Por equipo</span>
                  <span class="text-base font-black text-secondary tabular-nums">{{ playersPerTeam() }}</span>
                </div>
                <div class="rounded-lg border border-secondary/10 bg-white p-2.5 shadow-xs">
                  <span class="block text-[10px] font-bold uppercase tracking-wider text-secondary/60">Arqueros</span>
                  <span class="text-base font-black text-alternative tabular-nums">{{ goalkeeperCount() }}</span>
                </div>
              </div>

              <!-- Action Controls -->
              <div class="space-y-2.5 pt-2">
                <div data-secondary-actions class="grid grid-cols-2 gap-2.5">
                  <ui-button variant="secondary" [disabled]="!store.canDraw()" (click)="continueByHand()">
                    {{ t().preview.continue }}
                    <i
                      class="fa-solid"
                      [class.fa-lock]="manualLocked()"
                      [class.fa-arrow-right]="!manualLocked()"
                      aria-hidden="true"
                    ></i>
                  </ui-button>
                  <ui-button variant="outline" (click)="store.back()">
                    <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
                    {{ t().preview.back }}
                  </ui-button>
                </div>
                <div data-manual-notice>
                  <app-lock-notice
                    [reason]="manualNotice()?.reason ?? null"
                    [message]="manualNotice()?.message ?? null"
                  />
                </div>
                <ui-button size="lg" [disabled]="!store.canDraw()" (click)="store.draw()">
                  <i class="fa-solid fa-shuffle" aria-hidden="true"></i>
                  {{ t().preview.draw }}
                </ui-button>
              </div>
            </div>
          </ui-card>
        </aside>

        <!-- Player Roster List Panel -->
        <main class="lg:col-span-8">
          <ui-card>
            <div card-header class="flex flex-wrap items-center justify-between gap-2 border-b border-secondary/10 pb-3">
              <div class="flex items-center gap-2.5">
                <h2>{{ t().preview.title }}</h2>
                <ui-badge tone="neutral">{{ store.playerCount() }}</ui-badge>
              </div>
              <span class="text-xs text-secondary/60">Edita nombres o asigna arqueros</span>
            </div>

            <div class="space-y-3 pt-2">
              <div class="flex items-center justify-between px-3 text-[11px] font-bold uppercase tracking-wider text-secondary/50">
                <span># Jugador</span>
                <span>Acciones</span>
              </div>

              <div role="list" class="divide-y divide-secondary/8 space-y-1">
                @for (player of store.players(); track player.id; let i = $index) {
                  <ui-list-row>
                    <span row-start class="inline-block w-6 text-right font-semibold">{{ i + 1 }}</span>
                    @if (editingId() === player.id) {
                      <ui-input
                        [label]="t().preview.nameLabel"
                        [labelHidden]="true"
                        [value]="draftName()"
                        (valueChange)="draftName.set($event)"
                        (keydown.enter)="save(player.id)"
                        (keydown.escape)="cancel()"
                        (focusout)="save(player.id)"
                      />
                    } @else {
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="font-medium text-secondary">{{ player.name }}</span>
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
                      (click)="startEdit(player)"
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
            </div>
          </ui-card>
        </main>
      </div>
    </section>
  `,
})
export class PreviewStep {
  protected readonly store = inject(AmistosoStore);
  private readonly i18n = inject(I18n);
  private readonly injector = inject(Injector);
  private readonly entitlements = inject(Entitlements);

  protected readonly t = computed(() => this.i18n.t().tool);
  protected readonly editingId = signal<string | null>(null);
  protected readonly draftName = signal('');
  private readonly editor = viewChild(UiInput);

  protected readonly lock = signal<{ reason: LockReason; message: string } | null>(null);
  protected readonly manualNotice = signal<{ reason: LockReason; message: string } | null>(null);
  protected readonly manualLocked = computed(() => this.entitlements.manualLock() !== null);

  protected readonly goalkeeperCount = computed(
    () => this.store.players().filter((p) => p.isGoalkeeper).length,
  );

  protected readonly playersPerTeam = computed(() => {
    const count = this.store.playerCount();
    const teams = this.store.teamCount();
    if (teams <= 0) return '0';
    const per = count / teams;
    return Number.isInteger(per) ? String(per) : per.toFixed(1);
  });

  protected readonly teamOptions = computed<SegmentedOption[]>(() =>
    [2, 3, 4, 5, 6].map((count) => {
      const locked = this.entitlements.teamsLock(count);
      const option: SegmentedOption = { value: String(count), label: String(count) };
      if (locked) {
        option.locked = locked;
        if (locked === 'premium') option.lockedLabel = this.i18n.t().locks.premiumLabel;
      }
      return option;
    }),
  );
  protected readonly teamValue = computed(() => String(this.store.teamCount()));

  protected readonly status = computed(() => {
    const { status } = this.t().preview;
    const count = this.store.playerCount();
    const teams = this.store.teamCount();
    const { min, max } = playerRange(teams);
    switch (this.store.countError()) {
      case 'too-few':
        return status.tooFew(min - count, min);
      case 'too-many':
        return status.tooMany(count - max, max);
      case 'uneven':
        return status.uneven(count, teams);
      default:
        return status.ok;
    }
  });

  protected readonly notice = computed(() => {
    const mismatch = this.store.sizeMismatch();
    return mismatch
      ? this.t().preview.sizeNotice(mismatch.perTeam, mismatch.teams, mismatch.count)
      : null;
  });

  protected readonly statusClass = computed(() =>
    this.store.canDraw() ? 'text-alternative' : 'text-red-700',
  );

  protected chooseTeams(value: string): void {
    this.lock.set(null);
    this.store.setTeamCount(Number(value));
  }

  // Goes to the teams without drawing them, to build them by hand. Without an account it
  // explains why it does not.
  protected continueByHand(): void {
    const lock = this.entitlements.manualLock();
    if (lock) {
      this.manualNotice.set({ reason: lock, message: this.t().preview.manualSignIn });
      return;
    }
    this.manualNotice.set(null);
    this.store.startManual();
  }

  protected touchLocked(option: SegmentedOption): void {
    if (!option.locked) return;
    const { teamsSignIn, teamsPremium } = this.t().preview;
    this.lock.set({
      reason: option.locked,
      message: option.locked === 'sign-in' ? teamsSignIn : teamsPremium,
    });
  }

  protected startEdit(player: Player): void {
    this.draftName.set(player.name);
    this.editingId.set(player.id);
    afterNextRender(
      () => {
        this.editor()?.focus();
        this.editor()?.select();
      },
      { injector: this.injector },
    );
  }

  protected save(id: string): void {
    if (this.editingId() !== id) return;
    this.store.renamePlayer(id, this.draftName());
    this.editingId.set(null);
  }

  protected cancel(): void {
    this.editingId.set(null);
  }
}
