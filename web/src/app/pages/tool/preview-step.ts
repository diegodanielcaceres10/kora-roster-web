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
  templateUrl: './preview-step.html',
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

  // "1 y 2", "1, 2 y 3": the numbers that name the teams, joined the way the language does.
  protected readonly teamNames = computed(() =>
    new Intl.ListFormat(this.i18n.lang(), { style: 'long', type: 'conjunction' }).format(
      Array.from({ length: this.store.teamCount() }, (_, i) => String(i + 1)),
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
