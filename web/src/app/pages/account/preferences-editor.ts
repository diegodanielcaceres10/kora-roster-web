import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAX_TEAM_SIZE, MAX_TEAMS, MIN_TEAM_SIZE, MIN_TEAMS } from '../../core/draw-teams';
import { formatTeamsForWhatsApp, Numbering } from '../../core/format-teams';
import { I18n } from '../../i18n/i18n';
import { Entitlements, LockReason } from '../../plans/entitlements';
import { LockNotice } from '../../plans/lock-notice';
import {
  DEFAULT_PREFERENCES,
  HEADER_MAX,
  Preferences,
  TEAM_ICONS,
} from '../../preferences/preferences';
import { PreferencesService } from '../../preferences/preferences-service';
import {
  SegmentedOption,
  SelectOption,
  ToastService,
  UiBadge,
  UiButton,
  UiCard,
  UiIcon,
  UiInput,
  UiSegmented,
} from '../../ui';

const SAMPLE_NAMES = [
  ['Diego', 'Mati', 'Nico'],
  ['Fede', 'Lucho', 'Santi'],
  ['Gonza', 'Tomi', 'Ale'],
  ['Joaco', 'Bruno', 'Axel'],
  ['Lauti', 'Thiago', 'Ian'],
  ['Maxi', 'Tano', 'Facu'],
];
const SAMPLE_TEAMS = SAMPLE_NAMES.map((names) =>
  names.map((name, i) => ({ name, isGoalkeeper: i === 0 })),
);

const NUMBERINGS: readonly Numbering[] = ['dot', 'paren', 'dash', 'none'];

const TILE =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xl text-amber-700 dark:text-primary';
const SECTION_TITLE = 'mr-auto font-display text-base font-black uppercase tracking-tight text-ink';
const FIELD_LABEL = 'block font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted';

const copyOf = (preferences: Preferences): Preferences => ({
  ...preferences,
  teams: preferences.teams.map((team) => ({ ...team })),
});

@Component({
  selector: 'app-preferences-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LockNotice, UiBadge, UiButton, UiCard, UiIcon, UiInput, UiSegmented],
  templateUrl: './preferences-editor.html',
})
export class PreferencesEditor {
  private readonly i18n = inject(I18n);
  private readonly preferences = inject(PreferencesService);
  private readonly toast = inject(ToastService);
  private readonly entitlements = inject(Entitlements);

  protected readonly t = computed(() => this.i18n.t().preferences);
  protected readonly textMax = HEADER_MAX;
  protected readonly tile = TILE;
  protected readonly sectionTitle = SECTION_TITLE;
  protected readonly fieldLabel = FIELD_LABEL;
  protected readonly iconOptions: SelectOption[] = TEAM_ICONS.map((icon) => ({
    value: icon,
    label: icon,
  }));

  protected readonly draft = signal<Preferences>(
    copyOf(this.preferences.active() ?? DEFAULT_PREFERENCES),
  );
  protected readonly lock = signal<{ reason: LockReason; message: string } | null>(null);

  // "Any", then 5v5, 6v6... up to the biggest team there can be.
  protected readonly sizeOptions = computed<SegmentedOption[]>(() => [
    { value: '', label: this.t().playersPerTeam.any },
    ...Array.from({ length: MAX_TEAM_SIZE - MIN_TEAM_SIZE + 1 }, (_, i) => ({
      value: String(MIN_TEAM_SIZE + i),
      label: `${MIN_TEAM_SIZE + i}v${MIN_TEAM_SIZE + i}`,
    })),
  ]);
  protected readonly sizeValue = computed(() => this.draft().playersPerTeam?.toString() ?? '');
  protected readonly sizeLabel = computed(
    () => this.sizeOptions().find((option) => option.value === this.sizeValue())?.label ?? '',
  );

  protected readonly teamCountOptions = computed<SegmentedOption[]>(() =>
    Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, i) => MIN_TEAMS + i).map((count) => {
      const locked = this.entitlements.teamsLock(count);
      const option: SegmentedOption = { value: String(count), label: String(count) };
      if (locked) {
        option.locked = locked;
        if (locked === 'premium') option.lockedLabel = this.i18n.t().locks.premiumLabel;
      }
      return option;
    }),
  );
  protected readonly teamCountValue = computed(() => String(this.draft().teamCount));
  protected readonly visibleTeams = computed(() =>
    this.draft().teams.slice(0, this.draft().teamCount),
  );

  protected readonly numberingOptions = computed<SegmentedOption[]>(() => {
    const { template } = this.t();
    return [
      { value: 'dot', label: template.numberingDot },
      { value: 'paren', label: template.numberingParen },
      { value: 'dash', label: template.numberingDash },
      { value: 'none', label: template.numberingNone },
    ];
  });

  protected readonly previewText = computed(() => {
    const { teams, teamCount, header, footer, numbering } = this.draft();
    const styles = teams
      .slice(0, teamCount)
      .map((team, i) => ({ icon: team.icon, title: this.teamTitle(i) }));
    return formatTeamsForWhatsApp(SAMPLE_TEAMS.slice(0, teamCount), styles, {
      header,
      footer,
      numbering,
    });
  });

  protected teamTitle(index: number): string {
    return this.i18n.t().tool.teamTitle(index + 1);
  }

  protected setSize(value: string): void {
    this.draft.update((d) => ({ ...d, playersPerTeam: value === '' ? null : Number(value) }));
  }

  protected setTeamCount(value: string): void {
    this.lock.set(null);
    const teamCount = Number(value);
    this.draft.update((d) => ({ ...d, teamCount }));
  }

  protected touchLocked(option: SegmentedOption): void {
    if (!option.locked) return;
    const { teamsSignIn, teamsPremium } = this.i18n.t().tool.preview;
    this.lock.set({
      reason: option.locked,
      message: option.locked === 'sign-in' ? teamsSignIn : teamsPremium,
    });
  }

  protected setIcon(index: number, icon: string): void {
    this.draft.update((d) => {
      const next = copyOf(d);
      const other = next.teams.findIndex((team, i) => i !== index && team.icon === icon);
      if (other >= 0) next.teams[other].icon = next.teams[index].icon;
      next.teams[index].icon = icon;
      return next;
    });
  }

  protected setColor(index: number, color: string): void {
    this.draft.update((d) => {
      const next = copyOf(d);
      next.teams[index].color = color;
      return next;
    });
  }

  protected setHeader(header: string): void {
    this.draft.update((d) => ({ ...d, header }));
  }

  protected setFooter(footer: string): void {
    this.draft.update((d) => ({ ...d, footer }));
  }

  protected setNumbering(value: string): void {
    const numbering = NUMBERINGS.find((known) => known === value);
    if (numbering) this.draft.update((d) => ({ ...d, numbering }));
  }

  protected save(): void {
    this.preferences.save(this.draft());
    this.draft.set(copyOf(this.preferences.active() ?? DEFAULT_PREFERENCES));
    this.toast.show(this.t().saved);
  }

  protected restore(): void {
    this.draft.set(copyOf(DEFAULT_PREFERENCES));
  }
}
