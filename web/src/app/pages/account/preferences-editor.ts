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
  UiButton,
  UiInput,
  UiSegmented,
  UiSelect,
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

const copyOf = (preferences: Preferences): Preferences => ({
  ...preferences,
  teams: preferences.teams.map((team) => ({ ...team })),
});

@Component({
  selector: 'app-preferences-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LockNotice, UiButton, UiInput, UiSegmented, UiSelect],
  template: `
    <section class="space-y-6">
      <div class="space-y-1">
        <h2>{{ t().title }}</h2>
        <p class="text-secondary/80">{{ t().description }}</p>
      </div>

      <ui-select
        [label]="t().playersPerTeam.label"
        [options]="sizeOptions()"
        [value]="sizeValue()"
        (valueChange)="setSize($event)"
      />

      <div class="space-y-2">
        <ui-segmented
          [label]="t().teamCount.label"
          [options]="teamCountOptions()"
          [value]="teamCountValue()"
          (valueChange)="setTeamCount($event)"
          (lockedSelect)="touchLocked($event)"
        />
        <app-lock-notice [reason]="lock()?.reason ?? null" [message]="lock()?.message ?? null" />
      </div>

      @for (team of visibleTeams(); track $index; let i = $index) {
        <fieldset class="space-y-3 rounded-xl border border-secondary/15 p-4">
          <legend class="px-1 font-semibold">{{ teamTitle(i) }}</legend>
          <ui-segmented
            [label]="t().teams.iconLabel(teamTitle(i))"
            [options]="iconOptions"
            [value]="team.icon"
            (valueChange)="setIcon(i, $event)"
          />
          <ui-input
            type="color"
            [label]="t().teams.colorLabel(teamTitle(i))"
            [value]="team.color"
            (valueChange)="setColor(i, $event)"
          />
        </fieldset>
      }

      <ui-input
        [label]="t().template.header"
        [placeholder]="t().template.headerPlaceholder"
        [maxLength]="textMax"
        [value]="draft().header"
        (valueChange)="setHeader($event)"
      />
      <ui-input
        [label]="t().template.footer"
        [placeholder]="t().template.footerPlaceholder"
        [maxLength]="textMax"
        [value]="draft().footer"
        (valueChange)="setFooter($event)"
      />
      <ui-select
        [label]="t().template.numbering"
        [options]="numberingOptions()"
        [value]="draft().numbering"
        (valueChange)="setNumbering($event)"
      />

      <div class="space-y-2">
        <h3>{{ t().preview.title }}</h3>
        <pre class="overflow-x-auto whitespace-pre-wrap rounded-lg bg-secondary/5 p-3 text-sm">{{
          previewText()
        }}</pre>
      </div>

      <div class="flex flex-wrap gap-3">
        <ui-button size="lg" (click)="save()">{{ t().save }}</ui-button>
        <ui-button variant="outline" (click)="restore()">{{ t().restore }}</ui-button>
      </div>
    </section>
  `,
})
export class PreferencesEditor {
  private readonly i18n = inject(I18n);
  private readonly preferences = inject(PreferencesService);
  private readonly toast = inject(ToastService);
  private readonly entitlements = inject(Entitlements);

  protected readonly t = computed(() => this.i18n.t().preferences);
  protected readonly textMax = HEADER_MAX;
  protected readonly iconOptions: SelectOption[] = TEAM_ICONS.map((icon) => ({
    value: icon,
    label: icon,
  }));

  // The form is a draft: nothing reaches the saved preferences until Save is pressed.
  protected readonly draft = signal<Preferences>(
    copyOf(this.preferences.active() ?? DEFAULT_PREFERENCES),
  );
  protected readonly lock = signal<{ reason: LockReason; message: string } | null>(null);

  protected readonly sizeOptions = computed<SelectOption[]>(() => [
    { value: '', label: this.t().playersPerTeam.any },
    ...Array.from({ length: MAX_TEAM_SIZE - MIN_TEAM_SIZE + 1 }, (_, i) => ({
      value: String(MIN_TEAM_SIZE + i),
      label: String(MIN_TEAM_SIZE + i),
    })),
  ]);
  protected readonly sizeValue = computed(() => this.draft().playersPerTeam?.toString() ?? '');

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
  // Only the teams in use are shown; the others stay saved, out of sight.
  protected readonly visibleTeams = computed(() =>
    this.draft().teams.slice(0, this.draft().teamCount),
  );

  protected readonly numberingOptions = computed<SelectOption[]>(() => {
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
    // The same sentences the tool shows under its own selector of teams.
    const { teamsSignIn, teamsPremium } = this.i18n.t().tool.preview;
    this.lock.set({
      reason: option.locked,
      message: option.locked === 'sign-in' ? teamsSignIn : teamsPremium,
    });
  }

  // Choosing an icon that another team has, shown or not, swaps the two: the six circles
  // are always all different.
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
    // Show what was really kept, in case something had to be cleaned.
    this.draft.set(copyOf(this.preferences.active() ?? DEFAULT_PREFERENCES));
    this.toast.show(this.t().saved);
  }

  protected restore(): void {
    this.draft.set(copyOf(DEFAULT_PREFERENCES));
  }
}
