import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MAX_TEAM_SIZE, MAX_TEAMS, MIN_TEAM_SIZE, MIN_TEAMS } from '../../core/draw-teams';
import { formatTeamsForWhatsApp, Numbering } from '../../core/format-teams';
import { StoryInput } from '../../core/story-layout';
import { I18n } from '../../i18n/i18n';
import { STORY_BLOB } from '../../image/story-image';
import { Entitlements, LockReason } from '../../plans/entitlements';
import { LockNotice } from '../../plans/lock-notice';
import {
  colorToIcon,
  DEFAULT_PREFERENCES,
  HEADER_MAX,
  Preferences,
} from '../../preferences/preferences';
import { PreferencesService } from '../../preferences/preferences-service';
import { Theme } from '../../theme/theme';
import {
  SegmentedOption,
  ToastService,
  UiBadge,
  UiButton,
  UiCard,
  UiIcon,
  UiInput,
  UiSegmented,
} from '../../ui';

// Three numbered players for each of the six teams, the first one in goal.
const sampleTeamsOf = (name: (n: number) => string) =>
  Array.from({ length: 6 }, (_, team) =>
    Array.from({ length: 3 }, (_, i) => ({
      name: name(team * 3 + i + 1),
      isGoalkeeper: i === 0,
    })),
  );

const NUMBERINGS: readonly Numbering[] = ['dot', 'paren', 'dash', 'none'];

type PreviewView = 'message' | 'image';

// How long the template has to stay still before the image of the preview is made again: making
// it takes a moment, so it is not made for every letter that is typed.
const IMAGE_PAUSE_MS = 300;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const TILE =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xl text-amber-700 dark:text-primary';
const SECTION_TITLE = 'mr-auto font-display text-base font-black uppercase tracking-tight text-ink';
const FIELD_LABEL = 'block font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted';

const copyOf = (preferences: Preferences): Preferences => ({
  ...preferences,
  teams: preferences.teams.map((team) => ({
    ...team,
    icon: colorToIcon(team.color),
  })),
});

const samePreferences = (a: Preferences, b: Preferences): boolean =>
  a.playersPerTeam === b.playersPerTeam &&
  a.teamCount === b.teamCount &&
  a.header === b.header &&
  a.location === b.location &&
  a.footer === b.footer &&
  a.numbering === b.numbering &&
  a.teams.length === b.teams.length &&
  a.teams.every((team, i) => team.color === b.teams[i].color && team.icon === b.teams[i].icon);

@Component({
  selector: 'app-preferences-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LockNotice, UiBadge, UiButton, UiCard, UiIcon, UiInput, UiSegmented],
  host: { class: 'block' },
  templateUrl: './preferences-editor.html',
})
export class PreferencesEditor {
  private readonly i18n = inject(I18n);
  private readonly preferences = inject(PreferencesService);
  private readonly toast = inject(ToastService);
  private readonly entitlements = inject(Entitlements);
  private readonly createBlob = inject(STORY_BLOB);
  private readonly theme = inject(Theme);

  protected readonly t = computed(() => this.i18n.t().preferences);
  protected readonly textMax = HEADER_MAX;
  protected readonly tile = TILE;
  protected readonly sectionTitle = SECTION_TITLE;
  protected readonly fieldLabel = FIELD_LABEL;

  protected readonly draft = signal<Preferences>(
    copyOf(this.preferences.active() ?? DEFAULT_PREFERENCES),
  );
  protected readonly hasChanges = computed(
    () => !samePreferences(this.draft(), this.preferences.active() ?? DEFAULT_PREFERENCES),
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
  protected readonly visibleTeams = computed(() => this.draft().teams);
  protected readonly teamsPremiumMessage = computed(() => this.i18n.t().tool.preview.teamsPremium);

  protected isTeamLocked(index: number): boolean {
    return this.entitlements.teamsLock(index + 1) === 'premium';
  }

  protected readonly numberingOptions = computed<SegmentedOption[]>(() => {
    const { template } = this.t();
    return [
      { value: 'dot', label: template.numberingDot },
      { value: 'paren', label: template.numberingParen },
      { value: 'dash', label: template.numberingDash },
      { value: 'none', label: template.numberingNone },
    ];
  });

  // Sample players and a sample place, so the preview shows where everything goes.
  private readonly sampleTeams = computed(() => sampleTeamsOf(this.i18n.t().tool.playerName));
  private readonly previewLocation = computed(() => {
    const { location } = this.draft();
    return location.trim() ? location : this.t().template.locationSample;
  });

  protected readonly previewText = computed(() => {
    const { teams, teamCount, header, footer, numbering } = this.draft();
    const styles = teams
      .slice(0, teamCount)
      .map((team, i) => ({ icon: team.icon, title: this.teamTitle(i) }));
    return formatTeamsForWhatsApp(this.sampleTeams().slice(0, teamCount), styles, {
      header,
      location: this.previewLocation(),
      footer,
      numbering,
    });
  });

  // The preview has two tabs: the message and the image that can be downloaded.
  protected readonly previewView = signal<PreviewView>('message');
  protected readonly viewOptions = computed<SegmentedOption[]>(() => {
    const { preview } = this.t();
    return [
      { value: 'message', label: preview.messageTab },
      { value: 'image', label: preview.imageTab },
    ];
  });

  // The image is made with the same code as the one that is downloaded, from the same kind of
  // input, so what is seen here is what comes out.
  private readonly previewStory = computed((): StoryInput => {
    const { teams, teamCount, header, footer, numbering } = this.draft();
    const { result } = this.i18n.t().tool;
    return {
      teams: teams.slice(0, teamCount).map((team, i) => ({
        title: this.teamTitle(i),
        color: team.color,
        players: this.sampleTeams()[i],
      })),
      header,
      location: this.previewLocation(),
      footer,
      numbering,
      confirmed: result.storyConfirmed,
      brand: result.storyBrand,
      theme: this.theme.mode(),
    };
  });
  protected readonly imageUrl = signal<string | null>(null);
  protected readonly imageFailed = signal(false);
  protected readonly imageFailedText = computed(() => this.i18n.t().tool.result.imageFailed);
  private lastMade: StoryInput | null = null;
  private turn = 0;

  constructor() {
    // Only while the tab of the image is on, and only when the input is not the one already made.
    effect((onCleanup) => {
      if (this.previewView() !== 'image') return;
      const input = this.previewStory();
      if (input === this.lastMade) return;
      const timer = setTimeout(() => void this.makeImage(input), IMAGE_PAUSE_MS);
      onCleanup(() => clearTimeout(timer));
    });
    inject(DestroyRef).onDestroy(() => {
      this.turn++;
      const url = this.imageUrl();
      if (url) URL.revokeObjectURL(url);
    });
  }

  private async makeImage(input: StoryInput): Promise<void> {
    const turn = ++this.turn;
    this.lastMade = input;
    this.imageFailed.set(false);
    try {
      const blob = await this.createBlob(input);
      // An older image that arrives after a newer one is not wanted.
      if (turn !== this.turn) return;
      const previous = this.imageUrl();
      this.imageUrl.set(URL.createObjectURL(blob));
      if (previous) URL.revokeObjectURL(previous);
    } catch {
      if (turn !== this.turn) return;
      this.lastMade = null;
      this.imageFailed.set(true);
    }
  }

  protected setView(value: string): void {
    if (value === 'message' || value === 'image') this.previewView.set(value);
  }

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

  protected setColor(index: number, color: string): void {
    const normalized = color.toLowerCase();
    if (!HEX_COLOR.test(normalized)) return;
    this.draft.update((d) => {
      const next = copyOf(d);
      next.teams[index].color = normalized;
      next.teams[index].icon = colorToIcon(normalized);
      return next;
    });
  }

  protected hexDisplay(color: string): string {
    return color.replace(/^#/, '').toUpperCase();
  }

  protected onHexInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    let raw = input.value.trim();
    if (raw.startsWith('#')) raw = raw.slice(1);
    raw = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    if (raw.length === 6) {
      this.setColor(index, `#${raw}`);
    }
  }

  protected onHexBlur(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = this.hexDisplay(this.draft().teams[index].color);
  }

  protected setHeader(header: string): void {
    this.draft.update((d) => ({ ...d, header }));
  }

  protected setLocation(location: string): void {
    this.draft.update((d) => ({ ...d, location }));
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
