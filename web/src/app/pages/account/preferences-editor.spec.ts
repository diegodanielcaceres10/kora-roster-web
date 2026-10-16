import { TestBed } from '@angular/core/testing';
import { provideFakeGoogle } from '../../auth/testing';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { DEFAULT_PREFERENCES, Preferences } from '../../preferences/preferences';
import { PreferencesService } from '../../preferences/preferences-service';
import { ToastService } from '../../ui';
import { PreferencesEditor } from './preferences-editor';

const T = DICTIONARIES.es;
const P = T.preferences;
const USER = {
  id: '1122334455',
  name: 'Diego Cáceres',
  email: 'diego@example.com',
  picture: 'https://lh3.googleusercontent.com/a/photo=s96-c',
};
const KEY = `kora:prefs:${USER.id}`;

const mine: Preferences = {
  playersPerTeam: 7,
  teams: [
    { icon: '🟢', color: '#00ff00' },
    { icon: '🟡', color: '#ffff00' },
  ],
  header: '⚽ Amistoso',
  footer: 'Confirmen',
  numbering: 'paren',
};

function setup(saved?: Preferences) {
  TestBed.configureTestingModule({ providers: provideFakeGoogle().providers });
  localStorage.setItem('kora:session', JSON.stringify(USER));
  if (saved) localStorage.setItem(KEY, JSON.stringify({ version: 1, preferences: saved }));
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
  const choose = (label: string, value: string) => {
    const select = field(label) as HTMLSelectElement;
    select.value = value;
    select.dispatchEvent(new Event('change'));
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
  const iconGroup = (team: number) => P.teams.iconLabel(T.tool.teamTitle(team));
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
    iconGroup,
    colorLabel,
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
      const { field, checkedIcon, iconGroup, colorLabel } = setup(mine);
      expect((field(P.playersPerTeam.label) as HTMLSelectElement).value).toBe('7');
      expect(checkedIcon(iconGroup(1))).toBe('🟢');
      expect(checkedIcon(iconGroup(2))).toBe('🟡');
      expect((field(colorLabel(1)) as HTMLInputElement).value).toBe('#00ff00');
      expect((field(colorLabel(2)) as HTMLInputElement).value).toBe('#ffff00');
      expect((field(P.template.header) as HTMLInputElement).value).toBe('⚽ Amistoso');
      expect((field(P.template.footer) as HTMLInputElement).value).toBe('Confirmen');
      expect((field(P.template.numbering) as HTMLSelectElement).value).toBe('paren');
    });

    it('starts from the defaults when nothing was saved', () => {
      const { field, checkedIcon, iconGroup, colorLabel } = setup();
      expect((field(P.playersPerTeam.label) as HTMLSelectElement).value).toBe('');
      expect(checkedIcon(iconGroup(1))).toBe('🔴');
      expect(checkedIcon(iconGroup(2))).toBe('🔵');
      expect((field(colorLabel(1)) as HTMLInputElement).value).toBe('#e53935');
      expect((field(P.template.header) as HTMLInputElement).value).toBe('');
      expect((field(P.template.numbering) as HTMLSelectElement).value).toBe('dot');
    });

    it('offers "any" and the team sizes from 5 to 11', () => {
      const { field } = setup();
      const options = Array.from((field(P.playersPerTeam.label) as HTMLSelectElement).options).map(
        (o) => [o.value, o.textContent?.trim()],
      );
      expect(options).toEqual([
        ['', P.playersPerTeam.any],
        ...[5, 6, 7, 8, 9, 10, 11].map((n) => [String(n), String(n)]),
      ]);
    });

    it('limits the header and the footer to 200 characters', () => {
      const { field } = setup();
      expect((field(P.template.header) as HTMLInputElement).maxLength).toBe(200);
      expect((field(P.template.footer) as HTMLInputElement).maxLength).toBe(200);
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
            line && !line.includes(T.tool.teamTitle(1)) && !line.includes(T.tool.teamTitle(2)),
        );
      expect(playerLines).toEqual(['Diego 🧤', 'Mati', 'Nico', 'Fede 🧤', 'Lucho', 'Santi']);
    });

    it('follows the icon of each team', () => {
      const { preview, pick, iconGroup } = setup();
      pick(iconGroup(1), '🟣');
      expect(preview()).toContain(`🟣 ${T.tool.teamTitle(1)}`);
      expect(preview()).toContain(`🔵 ${T.tool.teamTitle(2)}`);
    });
  });

  describe('team icons', () => {
    it('swaps with the other team when its icon is chosen, so they are never the same', () => {
      const { checkedIcon, pick, iconGroup } = setup();
      pick(iconGroup(1), '🔵');
      expect(checkedIcon(iconGroup(1))).toBe('🔵');
      expect(checkedIcon(iconGroup(2))).toBe('🔴');
    });

    it('works the same from the second team', () => {
      const { checkedIcon, pick, iconGroup } = setup();
      pick(iconGroup(2), '🔴');
      expect(checkedIcon(iconGroup(1))).toBe('🔵');
      expect(checkedIcon(iconGroup(2))).toBe('🔴');
    });
  });

  describe('saving', () => {
    it('keeps nothing until Save is pressed', () => {
      const { typeInto, choose, service } = setup();
      typeInto(P.template.header, 'Todavía no');
      choose(P.playersPerTeam.label, '9');
      expect(service.active()).toEqual(DEFAULT_PREFERENCES);
      expect(localStorage.getItem(KEY)).toBeNull();
    });

    it('saves every field for the account, says it was saved, and uses it right away', () => {
      const { typeInto, choose, pick, iconGroup, colorLabel, button, service, toast } = setup();
      choose(P.playersPerTeam.label, '7');
      pick(iconGroup(1), '🟢');
      pick(iconGroup(2), '🟡');
      typeInto(colorLabel(1), '#00ff00');
      typeInto(colorLabel(2), '#ffff00');
      typeInto(P.template.header, '⚽ Amistoso');
      typeInto(P.template.footer, 'Confirmen');
      choose(P.template.numbering, 'paren');
      button(P.save).click();

      expect(service.active()).toEqual(mine);
      expect(JSON.parse(localStorage.getItem(KEY) as string)).toEqual({
        version: 1,
        preferences: mine,
      });
      expect(toast.message()).toBe(P.saved);
    });

    it('goes back to "any" size when that option is chosen', () => {
      const { choose, button, service } = setup(mine);
      choose(P.playersPerTeam.label, '');
      button(P.save).click();
      expect(service.active()?.playersPerTeam).toBeNull();
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
      const { fixture, field, checkedIcon, iconGroup, button, service } = setup(mine);
      button(P.restore).click();
      fixture.detectChanges();
      expect((field(P.playersPerTeam.label) as HTMLSelectElement).value).toBe('');
      expect(checkedIcon(iconGroup(1))).toBe('🔴');
      expect((field(P.template.header) as HTMLInputElement).value).toBe('');
      expect(service.active()).toEqual(mine);
    });

    it('saves them when Save is pressed afterwards', () => {
      const { button, service } = setup(mine);
      button(P.restore).click();
      button(P.save).click();
      expect(service.active()).toEqual(DEFAULT_PREFERENCES);
    });
  });
});
