import { TestBed } from '@angular/core/testing';
import { drawTeams } from '../../core/draw-teams';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { AmistosoStore } from '../../state/amistoso.store';
import { ToastService } from '../../ui';
import { ResultStep } from './result-step';

const T = DICTIONARIES.es.tool;
const list = (count: number) =>
  Array.from({ length: count }, (_, i) => `Player ${i + 1}`).join('\n');

function setup() {
  TestBed.inject(I18n).setLang('es');
  const store = TestBed.inject(AmistosoStore);
  store.setRawText('Diego 🧤\nMati 🧤\n' + list(10));
  store.continueToPreview();
  store.draw(() => 0.3);
  const fixture = TestBed.createComponent(ResultStep);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const byText = (text: string) =>
    Array.from(el.querySelectorAll('ui-button button')).find((b) =>
      b.textContent?.includes(text),
    ) as HTMLButtonElement;
  return { fixture, el, store, byText, toast: TestBed.inject(ToastService) };
}

function setClipboard(writeText?: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText ? { writeText } : undefined,
    configurable: true,
  });
}

describe('ResultStep', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
    vi.restoreAllMocks();
    TestBed.inject(ToastService).dismiss();
    document.documentElement.lang = 'en';
  });

  it('shows a card per team with its icon and title in the current language', () => {
    const { el } = setup();
    const titles = Array.from(el.querySelectorAll('ui-card h3')).map((h) => h.textContent?.trim());
    expect(titles).toEqual([`🔴 ${T.teamTitle(1)}`, `🔵 ${T.teamTitle(2)}`]);
  });

  it('lists the players of each team, numbered from 1', () => {
    const { el, store } = setup();
    const cards = Array.from(el.querySelectorAll('ui-card'));
    const [teamA, teamB] = store.teams() ?? [[], []];
    [teamA, teamB].forEach((team, i) => {
      const items = Array.from(cards[i].querySelectorAll('li')).map((li) =>
        li.textContent?.replace(/\s+/g, ' ').trim(),
      );
      expect(items).toHaveLength(team.length);
      expect(items[0]).toMatch(new RegExp(`^1\\.\\s*${team[0].name}`));
      expect(items[team.length - 1]).toMatch(
        new RegExp(`^${team.length}\\.\\s*${team[team.length - 1].name}`),
      );
    });
  });

  it('marks the goalkeepers with the glove and a hidden label', () => {
    const { el } = setup();
    expect(el.querySelectorAll('li i.fa-mitten')).toHaveLength(2);
    const hidden = Array.from(el.querySelectorAll('li .sr-only')).map((s) => s.textContent?.trim());
    expect(hidden).toEqual([T.preview.goalkeeper, T.preview.goalkeeper]);
  });

  it('shows the text for WhatsApp exactly as it will be copied', () => {
    const { el, store } = setup();
    expect(el.querySelector('pre')?.textContent).toBe(store.whatsappText());
    expect(el.querySelector('pre')?.textContent).toContain(`🔴 ${T.teamTitle(1)}`);
  });

  describe('copying', () => {
    it('puts the text in the clipboard and says it was copied', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      setClipboard(writeText);
      const { store, byText, toast } = setup();
      byText(T.result.copy).click();
      await vi.waitFor(() => expect(toast.message()).toBe(T.result.copied));
      expect(writeText).toHaveBeenCalledWith(store.whatsappText());
    });

    it('says it could not copy when the clipboard refuses', async () => {
      setClipboard(vi.fn().mockRejectedValue(new Error('denied')));
      const { byText, toast } = setup();
      byText(T.result.copy).click();
      await vi.waitFor(() => expect(toast.message()).toBe(T.result.copyFailed));
    });

    it('says it could not copy when the browser has no clipboard', async () => {
      setClipboard(undefined);
      const { byText, toast } = setup();
      byText(T.result.copy).click();
      await vi.waitFor(() => expect(toast.message()).toBe(T.result.copyFailed));
    });
  });

  it('draws again with the players it already has', () => {
    const { fixture, store, byText } = setup();
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    byText(T.result.redraw).click();
    fixture.detectChanges();
    const expected = drawTeams(store.players(), () => 0.9);
    expect(expected.ok).toBe(true);
    if (expected.ok) expect(store.teams()).toEqual(expected.teams);
    expect(store.step()).toBe('result');
  });

  it('starts over from the beginning', () => {
    const { fixture, store, byText } = setup();
    byText(T.result.startOver).click();
    fixture.detectChanges();
    expect(store.step()).toBe('paste');
    expect(store.players()).toEqual([]);
    expect(store.teams()).toBeNull();
  });
});
