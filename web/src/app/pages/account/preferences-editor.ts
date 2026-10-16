import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { formatTeamsForWhatsApp, Numbering } from '../../core/format-teams';
import { I18n } from '../../i18n/i18n';
import {
  DEFAULT_PREFERENCES,
  HEADER_MAX,
  MAX_TEAM_SIZE,
  MIN_TEAM_SIZE,
  Preferences,
  TEAM_ICONS,
} from '../../preferences/preferences';
import { PreferencesService } from '../../preferences/preferences-service';
import { SelectOption, ToastService, UiButton, UiInput, UiSegmented, UiSelect } from '../../ui';

const SAMPLE_TEAMS = [
  [
    { name: 'Diego', isGoalkeeper: true },
    { name: 'Mati', isGoalkeeper: false },
    { name: 'Nico', isGoalkeeper: false },
  ],
  [
    { name: 'Fede', isGoalkeeper: true },
    { name: 'Lucho', isGoalkeeper: false },
    { name: 'Santi', isGoalkeeper: false },
  ],
];

const NUMBERINGS: readonly Numbering[] = ['dot', 'paren', 'dash', 'none'];

const copyOf = (preferences: Preferences): Preferences => ({
  ...preferences,
  teams: [{ ...preferences.teams[0] }, { ...preferences.teams[1] }],
});

@Component({
  selector: 'app-preferences-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButton, UiInput, UiSegmented, UiSelect],
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

      @for (team of draft().teams; track $index; let i = $index) {
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

  protected readonly sizeOptions = computed<SelectOption[]>(() => [
    { value: '', label: this.t().playersPerTeam.any },
    ...Array.from({ length: MAX_TEAM_SIZE - MIN_TEAM_SIZE + 1 }, (_, i) => ({
      value: String(MIN_TEAM_SIZE + i),
      label: String(MIN_TEAM_SIZE + i),
    })),
  ]);
  protected readonly sizeValue = computed(() => this.draft().playersPerTeam?.toString() ?? '');

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
    const { teams, header, footer, numbering } = this.draft();
    const styles = teams.map((team, i) => ({ icon: team.icon, title: this.teamTitle(i) }));
    return formatTeamsForWhatsApp(SAMPLE_TEAMS, styles, { header, footer, numbering });
  });

  protected teamTitle(index: number): string {
    return this.i18n.t().tool.teamTitle(index + 1);
  }

  protected setSize(value: string): void {
    this.draft.update((d) => ({ ...d, playersPerTeam: value === '' ? null : Number(value) }));
  }

  // Choosing the icon of the other team swaps the two, so they are never the same.
  protected setIcon(index: number, icon: string): void {
    this.draft.update((d) => {
      const next = copyOf(d);
      const other = index === 0 ? 1 : 0;
      if (next.teams[other].icon === icon) next.teams[other].icon = next.teams[index].icon;
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
