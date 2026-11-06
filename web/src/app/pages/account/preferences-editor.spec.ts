import { TestBed } from '@angular/core/testing';
import { provideFakeGoogle } from '../../auth/testing';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { DEFAULT_PREFERENCES, Preferences } from '../../preferences/preferences';
import { PreferencesService } from '../../preferences/preferences-service';
import { TEST_PREFERENCES } from '../../preferences/testing';
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

const mine = TEST_PREFERENCES;

function setup(saved?: Preferences) {
  TestBed.configureTestingModule({ providers: provideFakeGoogle().providers });
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
        version: 2,
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

    it('shows the icon and the color only of the teams in use', () => {
      const ctx = setup();
      expect(fieldsets(ctx)).toBe(2);
      choose(ctx, 4);
      expect(fieldsets(ctx)).toBe(4);
      choose(ctx, 3);
      expect(fieldsets(ctx)).toBe(3);
    });

    it('shows the number of teams that was saved', () => {
      const ctx = setup({ ...mine, teamCount: 3 });
      expect(checkedCount(ctx)).toBe('3');
      expect(fieldsets(ctx)).toBe(3);
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

    it('swaps icons with a team that is not shown, so the six circles stay different', () => {
      const ctx = setup();
      ctx.pick(ctx.iconGroup(1), '🟠');
      expect(ctx.checkedIcon(ctx.iconGroup(1))).toBe('🟠');
      ctx.button(P.save).click();
      const icons = ctx.service.active()?.teams.map((team) => team.icon) ?? [];
      expect(icons[0]).toBe('🟠');
      expect(icons[5]).toBe('🔴');
      expect(new Set(icons).size).toBe(6);
    });

    it('gives its old icon to a team that is not shown yet when its icon is taken, before saving', () => {
      const ctx = setup();
      // Team 3 is hidden and has 🟢: taking it for team 1 must hand team 1's old icon to team 3.
      ctx.pick(ctx.iconGroup(1), '🟢');
      choose(ctx, 3);
      expect(ctx.checkedIcon(ctx.iconGroup(1))).toBe('🟢');
      expect(ctx.checkedIcon(ctx.iconGroup(3))).toBe('🔴');
    });

    it('goes back to 2 teams when the defaults are restored', () => {
      const ctx = setup({ ...mine, teamCount: 4 });
      ctx.button(P.restore).click();
      ctx.fixture.detectChanges();
      expect(checkedCount(ctx)).toBe('2');
      expect(fieldsets(ctx)).toBe(2);
    });
  });
});
