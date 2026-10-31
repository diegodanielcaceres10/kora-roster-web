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
  UiIconButton,
  UiInput,
  UiListRow,
  UiSegmented,
} from '../../ui';

@Component({
  selector: 'app-preview-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LockNotice, UiBadge, UiButton, UiIconButton, UiInput, UiListRow, UiSegmented],
  template: `
    <section class="space-y-4">
      <h2>{{ t().preview.title }}</h2>

      <div class="space-y-2">
        <ui-segmented
          [label]="t().preview.teamsLabel"
          [options]="teamOptions()"
          [value]="teamValue()"
          (valueChange)="chooseTeams($event)"
          (lockedSelect)="touchLocked($event)"
        />
        <app-lock-notice [reason]="lock()?.reason ?? null" [message]="lock()?.message ?? null" />
      </div>

      <div>
        <p class="font-semibold">{{ t().preview.count(store.playerCount()) }}</p>
        <p role="status" [class]="statusClass()">{{ status() }}</p>
        @if (notice(); as message) {
          <p class="text-sm text-secondary/80">{{ message }}</p>
        }
      </div>

      <div role="list" class="space-y-1">
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
  private readonly entitlements = inject(Entitlements);

  protected readonly t = computed(() => this.i18n.t().tool);
  protected readonly editingId = signal<string | null>(null);
  protected readonly draftName = signal('');
  private readonly editor = viewChild(UiInput);

  protected readonly lock = signal<{ reason: LockReason; message: string } | null>(null);

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

  // Enter and losing focus both save. Closing the field after Escape can fire a focusout
  // too, which must not save, so only the row that is still being edited is saved.
  protected save(id: string): void {
    if (this.editingId() !== id) return;
    this.store.renamePlayer(id, this.draftName());
    this.editingId.set(null);
  }

  protected cancel(): void {
    this.editingId.set(null);
  }
}
