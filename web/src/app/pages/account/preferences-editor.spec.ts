import { TestBed } from '@angular/core/testing';
import { provideFakeGoogle } from '../../auth/testing';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { STORY_BLOB } from '../../image/story-image';
import type { StoryInput } from '../../core/story-layout';
import { DEFAULT_PREFERENCES, Preferences } from '../../preferences/preferences';
import { PreferencesService } from '../../preferences/preferences-service';
import { TEST_PREFERENCES } from '../../preferences/testing';
import { Theme } from '../../theme/theme';
import { ToastService } from '../../ui';
import { PreferencesEditor } from './preferences-editor';

const T = DICTIONARIES.es;
const P = T.preferences;
const USER = {
  id: '1122334455',
  name: 'Diego Daniel Caceres',
  email: 'diego@example.com',
  picture: 'https://lh3.googleusercontent.com/a/photo=s96-c',
};
const KEY = `kora:prefs:${USER.id}`;

const mine = TEST_PREFERENCES;

function setup(saved?: Preferences) {
  // The image of the preview is made with this stand-in, not with a canvas.
  const create = vi.fn<(input: StoryInput) => Promise<Blob>>(() =>
    Promise.resolve(new Blob(['png'], { type: 'image/png' })),
  );
  TestBed.configureTestingModule({
    providers: [...provideFakeGoogle().providers, { provide: STORY_BLOB, useValue: create }],
  });
  localStorage.setItem('kora:session', JSON.stringify(USER));
  if (saved) localStorage.setItem(KEY, JSON.stringify({ version: 2, preferences: saved }));
  TestBed.inject(I18n).setLang('es');

  const fixture = TestBed.createComponent(PreferencesEditor);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const detect = () => fixture.detectChanges();

  const field = (label: string) =>
    (
      Array.from(el.querySelectorAll('label')).find(
        (l) => l.textContent?.trim() === label,
      ) as HTMLLabelElement
    ).control as HTMLInputElement | HTMLSelectElement;
  const typeInto = (label: string, value: string) => {
    const input = field(label) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    detect();
  };
  // The size of the teams and the numbering are groups of options: press the one with this value.
  const optionLabel = (group: string, value: string): string => {
    const { template } = P;
    return {
      dot: template.numberingDot,
      paren: template.numberingParen,
      dash: template.numberingDash,
      none: template.numberingNone,
    }[value] as string;
  };
  const choose = (group: string, value: string) => {
    radios(group)
      .find((r) => r.textContent?.trim() === optionLabel(group, value))
      ?.click();
    detect();
  };
  const radios = (group: string) =>
    Array.from(
      el.querySelectorAll(`[role="radiogroup"][aria-label="${group}"] [role="radio"]`),
    ) as HTMLButtonElement[];
  const checkedIcon = (group: string) =>
    radios(group)
      .find((r) => r.getAttribute('aria-checked') === 'true')
      ?.textContent?.trim();
  const pick = (group: string, icon: string) => {
    radios(group)
      .find((r) => r.textContent?.trim() === icon)
      ?.click();
    detect();
  };
  const button = (text: string) =>
    Array.from(el.querySelectorAll('ui-button button')).find(
      (b) => b.textContent?.trim() === text,
    ) as HTMLButtonElement;
  const preview = () => el.querySelector('pre')?.textContent ?? '';
  const colorLabel = (team: number) => P.teams.colorLabel(T.tool.teamTitle(team));

  return {
    fixture,
    el,
    field,
    typeInto,
    choose,
    radios,
    checkedIcon,
    pick,
    button,
    preview,
    colorLabel,
    create,
    service: TestBed.inject(PreferencesService),
    toast: TestBed.inject(ToastService),
  };
}

describe('PreferencesEditor', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    TestBed.inject(ToastService).dismiss();
    localStorage.clear();
    document.documentElement.lang = 'en';
  });

  describe('the form', () => {
    it('shows the preferences the account saved', () => {
      const { field, checkedIcon, colorLabel } = setup({
        ...mine,
        location: 'Cancha de ejemplo, Calle Principal 123. https://maps.app.goo.gl/ejemplo',
      });
      expect((field(colorLabel(1)) as HTMLInputElement).value).toBe('#00ff00');
      expect((field(colorLabel(2)) as HTMLInputElement).value).toBe('#ffff00');
      expect((field(P.template.header) as HTMLInputElement).value).toBe('⚽ Amistoso');
      expect((field(P.template.location) as HTMLInputElement).value).toBe(
        'Cancha de ejemplo, Calle Principal 123. https://maps.app.goo.gl/ejemplo',
      );
      expect((field(P.template.footer) as HTMLInputElement).value).toBe('Confirmen');
      expect(checkedIcon(P.template.numbering)).toBe(P.template.numberingParen);
    });

    it('starts from the defaults when nothing was saved', () => {
      const { field, checkedIcon, colorLabel } = setup();
      expect((field(colorLabel(1)) as HTMLInputElement).value).toBe('#e53935');
      expect((field(P.template.header) as HTMLInputElement).value).toBe('');
      expect(checkedIcon(P.template.numbering)).toBe(P.template.numberingDot);
    });

    it('has no card for the team size: it is not a preference any more', () => {
      const { el } = setup(mine);
      expect(el.querySelector('[data-section="size"]')).toBeNull();
      expect(el.textContent).not.toContain('7v7');
    });

    it('offers the four numberings in one group', () => {
      const { radios } = setup();
      expect(radios(P.template.numbering).map((r) => r.textContent?.trim())).toEqual([
        P.template.numberingDot,
        P.template.numberingParen,
        P.template.numberingDash,
        P.template.numberingNone,
      ]);
    });

    it('says the number of teams per session that is chosen, in the title of its card', () => {
      const { el } = setup();
      const card = el.querySelector('[data-section="teams"]') as HTMLElement;
      expect(card.textContent).toContain(P.teamCount.default(2));
    });

    it('shows how many characters of the 200 the header, the location and the footer use', () => {
      const { el, typeInto } = setup();
      const counts = () =>
        Array.from(el.querySelectorAll('[data-count]')).map((c) => c.textContent?.trim());
      expect(counts()).toEqual(['0/200', '0/200', '0/200']);
      typeInto(P.template.header, 'Amistoso');
      typeInto(P.template.location, 'Cancha 3');
      expect(counts()).toEqual(['8/200', '8/200', '0/200']);
    });

    it('has the field of the location between the header and the footer, as in the message', () => {
      const { field } = setup();
      const fields = [P.template.header, P.template.location, P.template.footer].map(field);
      expect(fields[0].compareDocumentPosition(fields[1])).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(fields[1].compareDocumentPosition(fields[2])).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('gives an example of a location in the field', () => {
      const { field } = setup();
      expect((field(P.template.location) as HTMLInputElement).placeholder).toBe(
        P.template.locationPlaceholder,
      );
    });

    it('shows the preview as a message bubble', () => {
      const { el } = setup();
      expect(el.querySelector('[data-bubble] pre')).not.toBeNull();
    });

    it('limits the header, the location and the footer to 200 characters', () => {
      const { field } = setup();
      expect((field(P.template.header) as HTMLInputElement).maxLength).toBe(200);
      expect((field(P.template.location) as HTMLInputElement).maxLength).toBe(200);
      expect((field(P.template.footer) as HTMLInputElement).maxLength).toBe(200);
    });
  });

  describe('the tabs of the preview', () => {
    const PAUSE = 1000;
    let made = 0;

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      made = 0;
      URL.createObjectURL = vi.fn(() => `blob:preview-${++made}`);
      URL.revokeObjectURL = vi.fn();
    });
    afterEach(() => {
      vi.useRealTimers();
      Reflect.deleteProperty(URL, 'createObjectURL');
      Reflect.deleteProperty(URL, 'revokeObjectURL');
    });

    const tab = (t: ReturnType<typeof setup>, label: string) =>
      t.radios(P.preview.title).find((r) => r.textContent?.trim() === label) as HTMLButtonElement;
    const settle = async (t: ReturnType<typeof setup>) => {
      await vi.advanceTimersByTimeAsync(PAUSE);
      t.fixture.detectChanges();
    };
    const open = async (t: ReturnType<typeof setup>) => {
      tab(t, P.preview.imageTab).click();
      t.fixture.detectChanges();
      await settle(t);
    };
    const image = (t: ReturnType<typeof setup>) => t.el.querySelector('[data-image] img');
    const lastInput = (t: ReturnType<typeof setup>) => t.create.mock.lastCall?.[0] as StoryInput;

    it('has one tab for the WhatsApp message and one for the image, with the message first', () => {
      const t = setup();
      const tabs = t.radios(P.preview.title);
      expect(tabs.map((r) => r.textContent?.trim())).toEqual([
        P.preview.messageTab,
        P.preview.imageTab,
      ]);
      expect(tabs.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false']);
    });

    it('shows the message at first, with no image and nothing made', () => {
      const t = setup();
      expect(t.el.querySelector('[data-bubble]')).not.toBeNull();
      expect(t.el.querySelector('[data-image]')).toBeNull();
      expect(t.create).not.toHaveBeenCalled();
    });

    it('swaps the message for the image when the tab of the image is chosen', async () => {
      const t = setup();
      await open(t);
      expect(t.el.querySelector('[data-bubble]')).toBeNull();
      expect(t.el.querySelector('[data-image]')).not.toBeNull();
      expect(tab(t, P.preview.imageTab).getAttribute('aria-checked')).toBe('true');
    });

    it('brings the message back, with what was typed, when the first tab is chosen again', async () => {
      const t = setup();
      t.typeInto(P.template.header, 'Jueves 21hs');
      await open(t);
      tab(t, P.preview.messageTab).click();
      t.fixture.detectChanges();
      expect(t.el.querySelector('[data-image]')).toBeNull();
      expect(t.preview().startsWith('Jueves 21hs')).toBe(true);
    });

    it('makes the image from the sample teams and the template of the draft', async () => {
      const t = setup();
      await open(t);
      expect(t.create).toHaveBeenCalledTimes(1);
      const input = lastInput(t);
      expect(input.teams.map((x) => x.title)).toEqual([T.tool.teamTitle(1), T.tool.teamTitle(2)]);
      expect(input.teams.map((x) => x.color)).toEqual(
        DEFAULT_PREFERENCES.teams.slice(0, 2).map((x) => x.color),
      );
      expect(input.teams[0].players).toEqual([
        { name: T.tool.playerName(1), isGoalkeeper: true },
        { name: T.tool.playerName(2), isGoalkeeper: false },
        { name: T.tool.playerName(3), isGoalkeeper: false },
      ]);
      expect(input.header).toBe('');
      expect(input.location).toBe('');
      expect([input.footer, input.numbering]).toEqual(['', 'dot']);
      expect([input.confirmed, input.brand]).toEqual([
        T.tool.result.storyConfirmed,
        T.tool.result.storyBrand,
      ]);
      expect(input.theme).toBe('light');
    });

    it('follows what is typed and chosen in the template', async () => {
      const t = setup();
      await open(t);
      t.typeInto(P.template.location, 'Cancha Norte');
      t.typeInto(P.template.footer, 'Confirmen');
      t.choose(P.template.numbering, 'none');
      await settle(t);
      expect(t.create).toHaveBeenCalledTimes(2);
      const input = lastInput(t);
      expect([input.location, input.footer, input.numbering]).toEqual([
        'Cancha Norte',
        'Confirmen',
        'none',
      ]);
    });

    it('uses the colors and the number of teams that the account has', async () => {
      const t = setup({
        ...mine,
        teamCount: 3,
        teams: mine.teams.map((x, i) => (i === 0 ? { ...x, color: '#112233' } : x)),
      });
      await open(t);
      const input = lastInput(t);
      expect(input.teams).toHaveLength(3);
      expect(input.teams[0].color).toBe('#112233');
    });

    it('waits for a pause in the typing, so a burst makes one image and not one per letter', async () => {
      const t = setup();
      await open(t);
      for (const text of ['C', 'Ca', 'Can', 'Canc']) {
        t.typeInto(P.template.location, text);
        await vi.advanceTimersByTimeAsync(50);
      }
      await settle(t);
      expect(t.create).toHaveBeenCalledTimes(2);
      expect(lastInput(t).location).toBe('Canc');
    });

    it('makes nothing while the message tab is on, however much is typed', async () => {
      const t = setup();
      t.typeInto(P.template.location, 'Cancha Norte');
      await settle(t);
      expect(t.create).not.toHaveBeenCalled();
    });

    it('does not make the same image again when the tab comes back with nothing changed', async () => {
      const t = setup();
      await open(t);
      tab(t, P.preview.messageTab).click();
      t.fixture.detectChanges();
      await open(t);
      expect(t.create).toHaveBeenCalledTimes(1);
      expect(image(t)?.getAttribute('src')).toBe('blob:preview-1');
    });

    it('makes a new one when something changed while the other tab was on', async () => {
      const t = setup();
      await open(t);
      tab(t, P.preview.messageTab).click();
      t.fixture.detectChanges();
      t.typeInto(P.template.location, 'Cancha Norte');
      await open(t);
      expect(t.create).toHaveBeenCalledTimes(2);
      expect(lastInput(t).location).toBe('Cancha Norte');
    });

    it('does not make a new image when only the header is typed, as the image has no header', async () => {
      const t = setup();
      await open(t);
      t.typeInto(P.template.header, 'Jueves 21hs');
      await settle(t);
      expect(t.create).toHaveBeenCalledTimes(1);
      expect(image(t)?.getAttribute('src')).toBe('blob:preview-1');
    });

    it('makes a new one when the theme changes, as the image takes its colors', async () => {
      const t = setup();
      await open(t);
      TestBed.inject(Theme).set('dark');
      t.fixture.detectChanges();
      await settle(t);
      expect(t.create).toHaveBeenCalledTimes(2);
      expect(lastInput(t).theme).toBe('dark');
      TestBed.inject(Theme).set('light');
    });

    it('shows the image once it is made, described for assistive technology', async () => {
      const t = setup();
      await open(t);
      const img = image(t) as HTMLImageElement;
      expect(img.getAttribute('src')).toBe('blob:preview-1');
      expect(img.getAttribute('alt')).toBe(P.preview.imageAlt);
      expect(t.el.querySelector('[data-image]')?.textContent).not.toContain(P.preview.imageLoading);
    });

    it('says the image is being prepared until the first one is there', async () => {
      const t = setup();
      let release!: (blob: Blob) => void;
      t.create.mockImplementationOnce(() => new Promise<Blob>((resolve) => (release = resolve)));
      await open(t);
      expect(image(t)).toBeNull();
      const status = t.el.querySelector('[data-image] [role="status"]') as HTMLElement;
      expect(status.textContent?.trim()).toBe(P.preview.imageLoading);
      release(new Blob(['png']));
      await vi.advanceTimersByTimeAsync(0);
      t.fixture.detectChanges();
      expect(image(t)).not.toBeNull();
      expect(t.el.querySelector('[data-image] [role="status"]')).toBeNull();
    });

    it('keeps showing the last image while the next one is being made', async () => {
      const t = setup();
      await open(t);
      t.create.mockImplementationOnce(() => new Promise<Blob>(() => undefined));
      t.typeInto(P.template.location, 'Cancha Norte');
      await settle(t);
      expect(image(t)?.getAttribute('src')).toBe('blob:preview-1');
    });

    it('frees the image that it replaces', async () => {
      const t = setup();
      await open(t);
      t.typeInto(P.template.location, 'Cancha Norte');
      await settle(t);
      expect(image(t)?.getAttribute('src')).toBe('blob:preview-2');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');
      expect(URL.revokeObjectURL).not.toHaveBeenCalledWith('blob:preview-2');
    });

    it('frees the image when the editor goes away', async () => {
      const t = setup();
      await open(t);
      t.fixture.destroy();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');
    });

    it('ignores an older image that arrives after a newer one', async () => {
      const t = setup();
      let releaseOld!: (blob: Blob) => void;
      t.create.mockImplementationOnce(() => new Promise<Blob>((resolve) => (releaseOld = resolve)));
      await open(t);
      t.typeInto(P.template.location, 'Cancha Norte');
      await settle(t);
      expect(image(t)?.getAttribute('src')).toBe('blob:preview-1');
      releaseOld(new Blob(['old']));
      await vi.advanceTimersByTimeAsync(0);
      t.fixture.detectChanges();
      expect(image(t)?.getAttribute('src')).toBe('blob:preview-1');
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    });

    it('says when the image could not be made, and tries again with the next change', async () => {
      const t = setup();
      t.create.mockRejectedValueOnce(new Error('no canvas'));
      await open(t);
      expect(image(t)).toBeNull();
      expect(t.el.querySelector('[data-image] [role="alert"]')?.textContent?.trim()).toBe(
        T.tool.result.imageFailed,
      );
      t.typeInto(P.template.location, 'Cancha Norte');
      await settle(t);
      expect(image(t)).not.toBeNull();
      expect(t.el.querySelector('[data-image] [role="alert"]')).toBeNull();
    });
  });

  describe('the live preview', () => {
    it('shows a message with the icons and titles of the teams in the current language', () => {
      const { preview } = setup();
      expect(preview()).toContain(`🔴 ${T.tool.teamTitle(1)}`);
      expect(preview()).toContain(`🔵 ${T.tool.teamTitle(2)}`);
    });

    it('marks the goalkeepers of the example with the glove', () => {
      const { preview } = setup();
      expect(preview().match(/🧤/g)).toHaveLength(2);
    });

    it('puts the location after the header and before the teams while it is typed', () => {
      const { preview, typeInto } = setup();
      typeInto(P.template.header, '⚽ Jueves 21hs');
      typeInto(
        P.template.location,
        'Cancha de ejemplo, Calle Principal 123. https://maps.app.goo.gl/ejemplo',
      );
      expect(
        preview().startsWith(
          '⚽ Jueves 21hs\n\nCancha de ejemplo, Calle Principal 123. https://maps.app.goo.gl/ejemplo\n\n🔴 ',
        ),
      ).toBe(true);
    });

    it('shows a generic example of a location while the field is empty, like the sample players', () => {
      const { preview } = setup();
      expect(P.template.locationSample).toBeTruthy();
      expect(preview().startsWith(`${P.template.locationSample}\n\n🔴 `)).toBe(true);
    });

    it('puts the example after the header too, and before the teams', () => {
      const { preview, typeInto } = setup();
      typeInto(P.template.header, '⚽ Jueves 21hs');
      expect(preview().startsWith(`⚽ Jueves 21hs\n\n${P.template.locationSample}\n\n🔴 `)).toBe(
        true,
      );
    });

    it('swaps the example for what is typed, and brings it back when the field is cleared', () => {
      const { preview, typeInto } = setup();
      typeInto(P.template.location, 'Cancha Norte');
      expect(preview()).toContain('Cancha Norte');
      expect(preview()).not.toContain(P.template.locationSample);
      typeInto(P.template.location, '');
      expect(preview()).toContain(P.template.locationSample);
    });

    it('does not keep the example as a location: saving with the field empty saves nothing', () => {
      const { typeInto, button, service } = setup();
      typeInto(P.template.header, 'Amistoso');
      button(P.save).click();
      expect(service.active()?.location).toBe('');
    });

    it('follows the header and the footer while they are typed', () => {
      const { preview, typeInto } = setup();
      typeInto(P.template.header, '⚽ Jueves 21hs');
      typeInto(P.template.footer, 'Confirmen asistencia');
      expect(preview().startsWith('⚽ Jueves 21hs\n\n')).toBe(true);
      expect(preview().endsWith('\n\nConfirmen asistencia')).toBe(true);
    });

    it.each([
      ['dot', '1. '],
      ['paren', '1) '],
      ['dash', '1- '],
    ])('follows the numbering: %s', (numbering, start) => {
      const { preview, choose } = setup();
      choose(P.template.numbering, numbering);
      expect(preview()).toContain(`\n${start}`);
    });

    it('drops the numbers when asked for none', () => {
      const { preview, choose } = setup();
      choose(P.template.numbering, 'none');
      const playerLines = preview()
        .split('\n')
        .filter(
          (line) =>
            line &&
            line !== P.template.locationSample &&
            !line.includes(T.tool.teamTitle(1)) &&
            !line.includes(T.tool.teamTitle(2)),
        );
      const player = T.tool.playerName;
      expect(playerLines).toEqual([
        `${player(1)} 🧤`,
        player(2),
        player(3),
        `${player(4)} 🧤`,
        player(5),
        player(6),
      ]);
    });

    it('follows the icon of each team', () => {
      const { preview } = setup(mine);
      expect(preview()).toContain(`🟢 ${T.tool.teamTitle(1)}`);
      expect(preview()).toContain(`🟡 ${T.tool.teamTitle(2)}`);
    });
  });

  describe('team colors', () => {
    it('updates color from color picker input', () => {
      const { field, colorLabel, typeInto } = setup();
      typeInto(colorLabel(1), '#123456');
      expect((field(colorLabel(1)) as HTMLInputElement).value).toBe('#123456');
    });

    it('updates color from hex text input', () => {
      const { el, field, colorLabel, fixture } = setup();
      const hexInput = el.querySelectorAll('fieldset input[type="text"]')[0] as HTMLInputElement;
      hexInput.value = 'AABBCC';
      hexInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect((field(colorLabel(1)) as HTMLInputElement).value).toBe('#aabbcc');
    });
  });

  describe('saving', () => {
    it('keeps nothing until Save is pressed', () => {
      const { typeInto, choose, service } = setup();
      typeInto(P.template.header, 'Todavía no');
      choose(P.template.numbering, 'dash');
      expect(service.active()).toEqual(DEFAULT_PREFERENCES);
      expect(localStorage.getItem(KEY)).toBeNull();
    });

    it('saves every field for the account, says it was saved, and uses it right away', () => {
      const { typeInto, choose, colorLabel, button, service, toast } = setup();
      typeInto(colorLabel(1), '#00ff00');
      typeInto(colorLabel(2), '#ffff00');
      typeInto(P.template.header, '⚽ Amistoso');
      typeInto(
        P.template.location,
        'Cancha de ejemplo, Calle Principal 123. https://maps.app.goo.gl/ejemplo',
      );
      typeInto(P.template.footer, 'Confirmen');
      choose(P.template.numbering, 'paren');
      button(P.save).click();

      const expected = {
        ...DEFAULT_PREFERENCES,
        header: '⚽ Amistoso',
        location: 'Cancha de ejemplo, Calle Principal 123. https://maps.app.goo.gl/ejemplo',
        footer: 'Confirmen',
        numbering: 'paren' as const,
        teams: [
          { icon: '🟢', color: '#00ff00' },
          { icon: '🟡', color: '#ffff00' },
          ...DEFAULT_PREFERENCES.teams.slice(2),
        ],
      };
      expect(service.active()).toEqual(expected);
      expect(JSON.parse(localStorage.getItem(KEY) as string)).toEqual({
        version: 2,
        preferences: expected,
      });
      expect(toast.message()).toBe(P.saved);
    });

    it('cleans the preferences before keeping them, and the form shows what was kept', () => {
      const { fixture, typeInto, field, button, service } = setup();
      const long = 'x'.repeat(250);
      typeInto(P.template.header, long);
      button(P.save).click();
      fixture.detectChanges();
      expect(service.active()?.header.length).toBeLessThanOrEqual(200);
      expect((field(P.template.header) as HTMLInputElement).value).toBe(service.active()?.header);
    });
  });

  describe('restoring the defaults', () => {
    it('puts the default values in the form but saves nothing by itself', () => {
      const { fixture, field, checkedIcon, button, service } = setup(mine);
      button(P.restore).click();
      fixture.detectChanges();
      expect(checkedIcon(P.template.numbering)).toBe(P.template.numberingDot);
      expect((field(P.template.header) as HTMLInputElement).value).toBe('');
      expect((field(P.template.location) as HTMLInputElement).value).toBe('');
      expect(service.active()).toEqual(mine);
    });

    it('saves them when Save is pressed afterwards', () => {
      const { button, service } = setup(mine);
      button(P.restore).click();
      button(P.save).click();
      expect(service.active()).toEqual(DEFAULT_PREFERENCES);
    });
  });

  describe('enabling Save only when edited', () => {
    it('disables Save until a preference changes, and disables it again after saving or reverting', () => {
      const { fixture, typeInto, button } = setup();
      const saveBtn = () => button(P.save);
      expect(saveBtn().disabled).toBe(true);

      typeInto(P.template.header, 'Jueves');
      expect(saveBtn().disabled).toBe(false);

      typeInto(P.template.header, '');
      expect(saveBtn().disabled).toBe(true);

      typeInto(P.template.header, 'Jueves');
      expect(saveBtn().disabled).toBe(false);
      saveBtn().click();
      fixture.detectChanges();
      expect(saveBtn().disabled).toBe(true);
    });
  });

  describe('the number of teams', () => {
    const group = P.teamCount.label;
    const choose = (ctx: ReturnType<typeof setup>, count: number) => {
      ctx
        .radios(group)
        .find((r) => r.textContent?.trim().startsWith(String(count)))
        ?.click();
      ctx.fixture.detectChanges();
    };
    const checkedCount = (ctx: ReturnType<typeof setup>) =>
      ctx
        .radios(group)
        .find((r) => r.getAttribute('aria-checked') === 'true')
        ?.textContent?.trim();
    const fieldsets = (ctx: ReturnType<typeof setup>) => ctx.el.querySelectorAll('fieldset').length;
    const notice = (ctx: ReturnType<typeof setup>) =>
      ctx.el
        .querySelector('app-lock-notice [role="status"]')
        ?.textContent?.replace(/\s+/g, ' ')
        .trim() ?? '';

    it('offers 2 to 6 teams, with 2 chosen by default', () => {
      const ctx = setup();
      expect(ctx.radios(group).map((r) => r.textContent?.trim().charAt(0))).toEqual([
        '2',
        '3',
        '4',
        '5',
        '6',
      ]);
      expect(checkedCount(ctx)).toBe('2');
    });

    it('opens 2, 3 and 4, and keeps 5 and 6 for Premium', () => {
      const ctx = setup();
      expect(ctx.radios(group).map((r) => r.getAttribute('aria-disabled'))).toEqual([
        null,
        null,
        null,
        'true',
        'true',
      ]);
      expect(ctx.radios(group).map((r) => r.textContent?.includes(T.locks.premiumLabel))).toEqual([
        false,
        false,
        false,
        true,
        true,
      ]);
    });

    it('always shows all 6 teams, with 5 and 6 locked for non-premium accounts', () => {
      const ctx = setup();
      expect(fieldsets(ctx)).toBe(6);
      const sets = Array.from(ctx.el.querySelectorAll('fieldset'));
      expect(sets.slice(0, 4).every((fs) => fs.querySelector('input[type="color"]') !== null)).toBe(true);
      expect(
        sets.slice(4, 6).every(
          (fs) =>
            fs.querySelector('input[type="color"]') === null &&
            fs.querySelector('ui-icon[data-icon="lock"]') !== null &&
            fs.textContent?.includes(T.tool.preview.teamsPremium),
        ),
      ).toBe(true);
    });

    it('shows the number of teams that was saved', () => {
      const ctx = setup({ ...mine, teamCount: 3 });
      expect(checkedCount(ctx)).toBe('3');
      expect(fieldsets(ctx)).toBe(6);
    });

    it('shows a preview with as many teams as were chosen', () => {
      const ctx = setup();
      choose(ctx, 4);
      for (const [i, icon] of ['🔴', '🔵', '🟢', '🟡'].entries()) {
        expect(ctx.preview()).toContain(`${icon} ${T.tool.teamTitle(i + 1)}`);
      }
      expect(ctx.preview()).not.toContain(T.tool.teamTitle(5));
    });

    it('explains a locked 5 as Premium, and keeps the number of teams', () => {
      const ctx = setup();
      choose(ctx, 5);
      expect(notice(ctx)).toContain(T.tool.preview.teamsPremium);
      expect(checkedCount(ctx)).toBe('2');
    });

    it('stops explaining as soon as a number of teams is chosen', () => {
      const ctx = setup();
      choose(ctx, 6);
      choose(ctx, 3);
      expect(notice(ctx)).toBe('');
    });

    it('saves the number of teams together with everything else', () => {
      const ctx = setup();
      choose(ctx, 4);
      ctx.button(P.save).click();
      expect(ctx.service.active()?.teamCount).toBe(4);
      expect(JSON.parse(localStorage.getItem(KEY) as string).preferences.teamCount).toBe(4);
    });

    it('keeps the color of a team that is not shown while the number goes down and up', () => {
      const ctx = setup();
      choose(ctx, 4);
      ctx.typeInto(ctx.colorLabel(4), '#123456');
      choose(ctx, 2);
      choose(ctx, 4);
      expect((ctx.field(ctx.colorLabel(4)) as HTMLInputElement).value).toBe('#123456');
    });

    it('goes back to 2 teams when the defaults are restored', () => {
      const ctx = setup({ ...mine, teamCount: 4 });
      ctx.button(P.restore).click();
      ctx.fixture.detectChanges();
      expect(checkedCount(ctx)).toBe('2');
      expect(fieldsets(ctx)).toBe(6);
    });
  });

  it.each(['en', 'es', 'pt'] as const)('names its sections in %s', (lang) => {
    const { fixture, el } = setup();
    TestBed.inject(I18n).setLang(lang);
    fixture.detectChanges();
    const { preferences } = DICTIONARIES[lang];
    expect(el.textContent).toContain(preferences.teamsSection);
    expect(el.textContent).toContain(preferences.templateSection);
  });
});
