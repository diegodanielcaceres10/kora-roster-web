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
import { I18n } from '../../i18n/i18n';
import { Entitlements, LockReason } from '../../plans/entitlements';
import { LockNotice } from '../../plans/lock-notice';
import { FriendlyStore, Player } from '../../state/friendly.store';
import {
  SegmentedOption,
  UiBadge,
  UiButton,
  UiCard,
  UiIcon,
  UiIconButton,
  UiInput,
  UiListRow,
  UiSegmented,
  UiStat,
} from '../../ui';
import { countStatus } from './count-status';

const TEAM_LETTERS = 'ABCDEF';

@Component({
  selector: 'app-preview-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LockNotice,
    UiBadge,
    UiButton,
    UiCard,
    UiIcon,
    UiIconButton,
    UiInput,
    UiListRow,
    UiSegmented,
    UiStat,
  ],
  template: `
    <section class="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <ui-card class="lg:col-span-7">
        <div card-header class="flex items-center gap-3">
          <span
            class="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xl text-amber-700 dark:text-primary"
          >
            <ui-icon name="users" />
          </span>
          <div class="min-w-0">
            <h2 class="font-display text-base font-black uppercase tracking-tight text-ink">
              {{ t().preview.listTitle }}
            </h2>
            <p class="font-mono text-xs text-ink-muted">
              {{ t().preview.listSubtitle(store.playerCount()) }}
            </p>
          </div>
        </div>

        <div role="list" class="space-y-2">
          @for (player of store.players(); track player.id; let i = $index) {
            <ui-list-row tile>
              <span row-start class="inline-block w-6 font-mono text-xs text-ink-faint">
                {{ (i + 1).toString().padStart(2, '0') }}
              </span>
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
                  <span class="font-display font-bold text-ink">{{ player.name }}</span>
                  @if (player.isGoalkeeper) {
                    <ui-badge tone="primary">
                      <ui-icon name="glove" />
                      {{ t().preview.goalkeeper }}
                    </ui-badge>
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
                <ui-icon name="glove" />
              </ui-icon-button>
              <ui-icon-button
                row-end
                [label]="t().preview.edit(player.name)"
                (click)="startEdit(player)"
              >
                <ui-icon name="pencil" />
              </ui-icon-button>
              <ui-icon-button
                row-end
                variant="danger"
                [label]="t().preview.remove(player.name)"
                (click)="store.removePlayer(player.id)"
              >
                <ui-icon name="trash" />
              </ui-icon-button>
            </ui-list-row>
          }
        </div>
      </ui-card>

      <aside class="space-y-5 lg:col-span-5 lg:sticky lg:top-24">
        <ui-card>
          <div card-header class="flex items-center gap-3">
            <span
              class="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xl text-amber-700 dark:text-primary"
            >
              <ui-icon name="adjustments-horizontal" />
            </span>
            <h2
              class="mr-auto font-display text-base font-black uppercase tracking-tight text-ink"
            >
              {{ t().preview.settings }}
            </h2>
            <ui-badge>{{ t().preview.settingsTag }}</ui-badge>
          </div>

          <div class="space-y-4">
            <div class="space-y-2">
              <span
                class="block font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted"
              >
                {{ t().preview.teamsLabel }}
              </span>
              <ui-segmented
                stretch
                [label]="t().preview.teamsLabel"
                [options]="teamOptions()"
                [value]="teamValue()"
                (valueChange)="chooseTeams($event)"
                (lockedSelect)="touchLocked($event)"
              />
              <app-lock-notice
                [reason]="lock()?.reason ?? null"
                [message]="lock()?.message ?? null"
              />
            </div>

            <div class="grid grid-cols-3 gap-2">
              <ui-stat
                [label]="t().preview.teamsTile"
                [value]="String(store.teamCount())"
                [note]="teamNames()"
              />
              <ui-stat
                [label]="t().preview.perTeam"
                [value]="playersPerTeam()"
                valueTone="primary"
                [note]="evenNote()"
                [noteTone]="isEven() ? 'muted' : 'warning'"
              />
              <ui-stat
                [label]="t().preview.goalkeepers"
                [value]="String(goalkeeperCount())"
                [note]="goalkeeperNote()"
              />
            </div>

            <div
              class="flex items-start justify-between gap-3 rounded-xl border p-3.5"
              [class]="
                store.canDraw()
                  ? 'border-primary/30 bg-primary/10'
                  : 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'
              "
            >
              <div class="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  class="mt-1.5 size-2.5 shrink-0 rounded-full"
                  [class]="store.canDraw() ? 'bg-primary' : 'bg-red-600'"
                ></span>
                <div class="space-y-1">
                  <p
                    role="status"
                    [class]="statusClass()"
                    class="font-display text-sm font-bold uppercase tracking-wide"
                  >
                    {{ status() }}
                  </p>
                  @if (store.canDraw()) {
                    <p class="text-sm text-ink-muted">
                      {{ t().preview.readyDetail(store.playerCount()) }}
                    </p>
                  }
                  @if (notice(); as message) {
                    <p class="rounded-lg bg-ink/5 p-2 text-xs text-ink-muted">{{ message }}</p>
                  }
                </div>
              </div>
              <ui-icon
                [name]="store.canDraw() ? 'circle-check' : 'alert-circle'"
                [class]="
                  'shrink-0 text-xl ' +
                  (store.canDraw() ? 'text-amber-700 dark:text-primary' : 'text-red-700 dark:text-red-300')
                "
              />
            </div>
          </div>
        </ui-card>

        <ui-card>
          <div class="space-y-3">
            <ui-button size="lg" [disabled]="!store.canDraw()" (click)="store.draw()">
              <ui-icon name="bolt" />
              {{ t().preview.drawTeams }}
              <ui-icon name="arrow-right" class="ml-auto" />
            </ui-button>
            <ui-button
              size="lg"
              variant="outline"
              [disabled]="!store.canDraw()"
              (click)="continueByHand()"
            >
              {{ t().preview.continue }}
              <ui-icon [name]="manualLocked() ? 'lock' : 'arrow-right'" />
            </ui-button>
            <div data-manual-notice>
              <app-lock-notice
                [reason]="manualNotice()?.reason ?? null"
                [message]="manualNotice()?.message ?? null"
              />
            </div>
            <ui-button size="sm" variant="ghost" (click)="store.back()">
              <ui-icon name="arrow-left" />
              {{ t().preview.backToList }}
            </ui-button>
          </div>
        </ui-card>
      </aside>
    </section>
  `,
})
export class PreviewStep {
  protected readonly store = inject(FriendlyStore);
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

  // Sizes of the teams as they would come out: "6 vs 6", "5 vs 6" with two teams, a single figure
  // or a range with more.
  protected readonly playersPerTeam = computed(() => {
    const count = this.store.playerCount();
    const teams = this.store.teamCount();
    if (teams <= 0) return '0';
    const low = Math.floor(count / teams);
    const high = Math.ceil(count / teams);
    if (low === high) return teams === 2 ? `${low} vs ${low}` : String(low);
    return teams === 2 ? `${low} vs ${high}` : `${low}–${high}`;
  });

  protected readonly isEven = computed(() => {
    const teams = this.store.teamCount();
    return teams > 0 && this.store.playerCount() % teams === 0;
  });
  protected readonly evenNote = computed(() =>
    this.isEven() ? this.t().preview.evenTeams : this.t().preview.unevenTeams,
  );

  // "A y B", "A, B y C": the letters that name the teams, joined the way the language does.
  protected readonly teamNames = computed(() =>
    new Intl.ListFormat(this.i18n.lang(), { style: 'long', type: 'conjunction' }).format(
      TEAM_LETTERS.slice(0, this.store.teamCount()).split(''),
    ),
  );

  // Only said when it is exactly one goalkeeper for each team; anything else is not a promise.
  protected readonly goalkeeperNote = computed(() =>
    this.goalkeeperCount() === this.store.teamCount() ? this.t().preview.onePerTeam : '',
  );

  protected readonly String = String;

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

  protected readonly status = computed(() =>
    countStatus(this.t().preview.status, this.store.playerCount(), this.store.teamCount()),
  );

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
