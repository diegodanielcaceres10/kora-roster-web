import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { Preferences } from '../../preferences/preferences';
import { saveSession, TEST_PREFERENCES } from '../../preferences/testing';
import { AmistosoStore } from '../../state/amistoso.store';
import { PreviewStep } from './preview-step';

const T = DICTIONARIES.es.tool;
const list = (count: number) =>
  Array.from({ length: count }, (_, i) => `Player ${i + 1}`).join('\n');

function setup(text: string, preferences?: Preferences) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  if (preferences) saveSession(preferences);
  TestBed.inject(I18n).setLang('es');
  const store = TestBed.inject(AmistosoStore);
  store.setRawText(text);
  store.continueToPreview();
  const fixture = TestBed.createComponent(PreviewStep);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const rows = () => Array.from(el.querySelectorAll('ui-list-row')) as HTMLElement[];
  const byLabel = (label: string) =>
    el.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
  const byText = (text: string) =>
    Array.from(el.querySelectorAll('ui-button button')).find(
      (b) => b.textContent?.trim() === text,
    ) as HTMLButtonElement;
  const editor = () => el.querySelector('input') as HTMLInputElement | null;
  const click = (target: HTMLElement) => {
    target.click();
    fixture.detectChanges();
  };
  const press = (key: string) => {
    editor()?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  };
  const blur = () => {
    editor()?.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.detectChanges();
  };
  const names = () => store.players().map((p) => p.name);
  const type = (value: string) => {
    const field = editor() as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  return { fixture, el, store, rows, byLabel, byText, editor, click, press, blur, names, type };
}

describe('PreviewStep', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
  });

  describe('the list', () => {
    it('shows every player in order with its number', () => {
      const { rows } = setup('Diego\nMati\nNico');
      expect(rows().map((r) => r.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
        expect.stringMatching(/^1\s*Diego/),
        expect.stringMatching(/^2\s*Mati/),
        expect.stringMatching(/^3\s*Nico/),
      ]);
    });

    it('labels only the goalkeepers', () => {
      const { rows } = setup('Diego 🧤\nMati');
      expect(rows()[0].querySelector('ui-badge')?.textContent).toContain(T.preview.goalkeeper);
      expect(rows()[1].querySelector('ui-badge')).toBeNull();
    });
  });

  describe('count and status', () => {
    it('shows the count and that the list is ready', () => {
      const { el } = setup(list(12));
      expect(el.textContent).toContain(T.preview.count(12));
      expect(el.querySelector('p[role="status"]')?.textContent).toContain(T.preview.status.ok);
    });

    it.each([
      [9, T.preview.status.tooFew(1, 10)],
      [11, T.preview.status.uneven(11, 2)],
      [23, T.preview.status.tooMany(1, 22)],
    ])('explains what is wrong with %i players', (count, message) => {
      const { el } = setup(list(count));
      expect(el.querySelector('p[role="status"]')?.textContent).toContain(message);
    });

    it('updates when a player is removed', () => {
      const { el, rows, byLabel, click } = setup(list(11));
      click(byLabel(T.preview.remove('Player 3')));
      expect(rows()).toHaveLength(10);
      expect(el.querySelector('p[role="status"]')?.textContent).toContain(T.preview.status.ok);
    });
  });

  describe('buttons', () => {
    it('keeps Draw disabled while the count is not valid', () => {
      const { byText } = setup(list(11));
      expect(byText(T.preview.draw).disabled).toBe(true);
    });

    it('draws the teams and moves to the result when the count is valid', () => {
      const { store, byText, click } = setup(list(12));
      expect(byText(T.preview.draw).disabled).toBe(false);
      click(byText(T.preview.draw));
      expect(store.step()).toBe('result');
      expect(store.teams()).not.toBeNull();
    });

    it('goes back to the pasted text', () => {
      const { store, byText, click } = setup(list(12));
      click(byText(T.preview.back));
      expect(store.step()).toBe('paste');
    });
  });

  describe('continuing without drawing', () => {
    const pair = (el: HTMLElement) => el.querySelector('[data-secondary-actions]') as HTMLElement;
    const manualNotice = (el: HTMLElement) =>
      el
        .querySelector('[data-manual-notice] [role="status"]')
        ?.textContent?.replace(/\s+/g, ' ')
        .trim();

    it('puts Continue and Back on one row, with Draw below them', () => {
      const { el, byText } = setup(list(12));
      expect(pair(el).contains(byText(T.preview.continue))).toBe(true);
      expect(pair(el).contains(byText(T.preview.back))).toBe(true);
      expect(pair(el).contains(byText(T.preview.draw))).toBe(false);
      expect(pair(el).compareDocumentPosition(byText(T.preview.draw))).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    it.each([[true], [false]])(
      'keeps Continue disabled while the count is not valid (with an account: %s)',
      (account) => {
        if (account) saveSession();
        const { byText } = setup(list(11));
        expect(byText(T.preview.continue).disabled).toBe(true);
      },
    );

    describe('with an account', () => {
      beforeEach(() => saveSession());

      it('opens the teams empty, with everybody without a team, and nothing drawn', () => {
        const { store, byText, click } = setup(list(12));
        expect(byText(T.preview.continue).disabled).toBe(false);
        click(byText(T.preview.continue));
        expect(store.step()).toBe('result');
        expect(store.teams()).toEqual([[], []]);
        expect(store.pool()).toHaveLength(12);
        expect(store.isComplete()).toBe(false);
      });

      it('opens as many empty teams as were chosen', () => {
        const { fixture, store, byText, click } = setup(list(15));
        store.setTeamCount(3);
        fixture.detectChanges();
        click(byText(T.preview.continue));
        expect(store.teams()).toEqual([[], [], []]);
        expect(store.pool()).toHaveLength(15);
      });

      it('shows an arrow, not a lock, and says nothing', () => {
        const { el, byText } = setup(list(12));
        const button = byText(T.preview.continue);
        expect(button.querySelector('i.fa-arrow-right')).not.toBeNull();
        expect(button.querySelector('i.fa-lock')).toBeNull();
        expect(manualNotice(el) ?? '').toBe('');
      });
    });

    describe('without an account', () => {
      it('shows a lock and says nothing until it is touched', () => {
        const { el, byText } = setup(list(12));
        const button = byText(T.preview.continue);
        expect(button.disabled).toBe(false);
        expect(button.querySelector('i.fa-lock')).not.toBeNull();
        expect(button.querySelector('i.fa-arrow-right')).toBeNull();
        expect(manualNotice(el) ?? '').toBe('');
      });

      it('does not move on when it is touched, and offers to sign in', () => {
        const { el, store, byText, click } = setup(list(12));
        click(byText(T.preview.continue));
        expect(store.step()).toBe('preview');
        expect(store.teams()).toBeNull();
        expect(store.pool()).toEqual([]);
        expect(manualNotice(el)).toContain(T.preview.manualSignIn);
        expect(el.querySelector('[data-manual-notice] a')?.getAttribute('href')).toBe('/es/cuenta');
      });

      it('still draws', () => {
        const { store, byText, click } = setup(list(12));
        click(byText(T.preview.draw));
        expect(store.step()).toBe('result');
        expect(store.isComplete()).toBe(true);
      });
    });
  });

  describe('removing and the goalkeeper glove', () => {
    it('removes only the player whose cross is pressed', () => {
      const { names, byLabel, click } = setup('Diego\nMati\nNico');
      click(byLabel(T.preview.remove('Mati')));
      expect(names()).toEqual(['Diego', 'Nico']);
    });

    it('toggles the goalkeeper mark and tells which action the button will do', () => {
      const { store, byLabel, click } = setup('Diego\nMati');
      const mark = byLabel(T.preview.markGoalkeeper('Mati'));
      expect(mark.getAttribute('aria-pressed')).toBe('false');
      click(mark);
      expect(store.players()[1].isGoalkeeper).toBe(true);
      const unmark = byLabel(T.preview.unmarkGoalkeeper('Mati'));
      expect(unmark.getAttribute('aria-pressed')).toBe('true');
      click(unmark);
      expect(store.players()[1].isGoalkeeper).toBe(false);
    });
  });

  describe('editing a name', () => {
    it('opens a field with the current name and focuses it', async () => {
      const { fixture, el, editor, byLabel, click } = setup('Diego\nMati');
      click(byLabel(T.preview.edit('Mati')));
      await fixture.whenStable();
      expect(editor()?.value).toBe('Mati');
      const label = el.querySelector('label.sr-only') as HTMLLabelElement;
      expect(label.textContent?.trim()).toBe(T.preview.nameLabel);
      expect(label.control).toBe(editor());
      expect(document.activeElement).toBe(editor());
    });

    it('saves with Enter and closes the field', () => {
      const { byLabel, click, press, names, editor, type } = setup('Diego\nMati');
      click(byLabel(T.preview.edit('Mati')));
      type('Matías');
      press('Enter');
      expect(names()).toEqual(['Diego', 'Matías']);
      expect(editor()).toBeNull();
    });

    it('cancels with Escape, even if a blur arrives while the field is closing', () => {
      const { fixture, editor, byLabel, click, names, type } = setup('Diego\nMati');
      click(byLabel(T.preview.edit('Mati')));
      const field = editor() as HTMLInputElement;
      type('Changed');
      field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      // Browsers can fire the blur before Angular removes the field from the page.
      field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      fixture.detectChanges();
      expect(names()).toEqual(['Diego', 'Mati']);
      expect(editor()).toBeNull();
    });

    it('keeps the old name when it is left empty, and closes the field', () => {
      const { byLabel, click, press, names, editor, type } = setup('Diego\nMati');
      click(byLabel(T.preview.edit('Mati')));
      type('   ');
      press('Enter');
      expect(names()).toEqual(['Diego', 'Mati']);
      expect(editor()).toBeNull();
    });

    it('saves when the field loses focus', () => {
      const { byLabel, click, blur, names, type } = setup('Diego\nMati');
      click(byLabel(T.preview.edit('Mati')));
      type('Matías');
      blur();
      expect(names()).toEqual(['Diego', 'Matías']);
    });

    it('edits one row at a time', () => {
      const { el, byLabel, click } = setup('Diego\nMati');
      click(byLabel(T.preview.edit('Diego')));
      click(byLabel(T.preview.edit('Mati')));
      expect(el.querySelectorAll('input')).toHaveLength(1);
    });
  });

  describe('the team size the person usually plays', () => {
    const notice = (el: HTMLElement) => el.textContent as string;

    it('tells them when the list is not that size', () => {
      const { el } = setup(list(12), TEST_PREFERENCES);
      expect(notice(el)).toContain(T.preview.sizeNotice(7, 2, 12));
    });

    it('says nothing when the list is exactly that size', () => {
      const { el } = setup(list(14), TEST_PREFERENCES);
      expect(notice(el)).not.toContain(T.preview.sizeNotice(7, 2, 14));
      expect(notice(el)).not.toContain('Sueles jugar');
    });

    it('says nothing when the person allows any size', () => {
      const { el } = setup(list(12), { ...TEST_PREFERENCES, playersPerTeam: null });
      expect(notice(el)).not.toContain('Sueles jugar');
    });

    it('says nothing to somebody who is not signed in', () => {
      const { el } = setup(list(12));
      expect(notice(el)).not.toContain('Sueles jugar');
    });

    it('does not stop them from drawing a list that is valid', () => {
      const { byText } = setup(list(12), TEST_PREFERENCES);
      expect(byText(T.preview.draw).disabled).toBe(false);
    });

    it('appears next to the problem when the list is not valid either', () => {
      const { el } = setup(list(11), TEST_PREFERENCES);
      expect(notice(el)).toContain(T.preview.status.uneven(11, 2));
      expect(notice(el)).toContain(T.preview.sizeNotice(7, 2, 11));
    });
  });

  describe('the number of teams', () => {
    const radios = (el: HTMLElement) =>
      Array.from(
        el.querySelectorAll(
          `[role="radiogroup"][aria-label="${T.preview.teamsLabel}"] [role="radio"]`,
        ),
      ) as HTMLButtonElement[];
    const checked = (el: HTMLElement) =>
      radios(el)
        .find((r) => r.getAttribute('aria-checked') === 'true')
        ?.textContent?.trim();
    const countStatus = (el: HTMLElement) => el.querySelector('p[role="status"]')?.textContent;
    const notice = (el: HTMLElement) =>
      el.querySelector('app-lock-notice [role="status"]')?.textContent?.replace(/\s+/g, ' ').trim();
    const locks = DICTIONARIES.es.locks;

    it('offers 2 to 6 teams, with 2 chosen', () => {
      const { el } = setup(list(12));
      expect(radios(el).map((r) => r.textContent?.trim().charAt(0))).toEqual([
        '2',
        '3',
        '4',
        '5',
        '6',
      ]);
      expect(checked(el)).toBe('2');
    });

    it('locks 3 and 4 for sign in, and 5 and 6 for Premium, without an account', () => {
      const { el } = setup(list(12));
      expect(radios(el).map((r) => r.getAttribute('aria-disabled'))).toEqual([
        null,
        'true',
        'true',
        'true',
        'true',
      ]);
      expect(radios(el).map((r) => r.textContent?.includes(locks.premiumLabel))).toEqual([
        false,
        false,
        false,
        true,
        true,
      ]);
    });

    it('opens 3 and 4 with an account, and keeps 5 and 6 for Premium', () => {
      saveSession();
      const { el } = setup(list(12));
      expect(radios(el).map((r) => r.getAttribute('aria-disabled'))).toEqual([
        null,
        null,
        null,
        'true',
        'true',
      ]);
    });

    it('says nothing about locks until one is touched', () => {
      const { el } = setup(list(12));
      expect(notice(el) ?? '').toBe('');
    });

    it('explains a locked 3 and offers to sign in, keeping the teams as they were', () => {
      const { el, store, click } = setup(list(12));
      click(radios(el)[1]);
      expect(notice(el)).toContain(T.preview.teamsSignIn);
      expect(el.querySelector('app-lock-notice a')?.getAttribute('href')).toBe('/es/cuenta');
      expect(checked(el)).toBe('2');
      expect(store.teamCount()).toBe(2);
    });

    it('explains a locked 5 as Premium, with nothing to sign in to', () => {
      saveSession();
      const { el, click } = setup(list(12));
      click(radios(el)[3]);
      expect(notice(el)).toContain(T.preview.teamsPremium);
      expect(el.querySelector('app-lock-notice a')).toBeNull();
    });

    it('stops explaining as soon as a number of teams is chosen', () => {
      saveSession();
      const { el, click } = setup(list(18));
      click(radios(el)[3]);
      expect(notice(el)).toContain(T.preview.teamsPremium);
      click(radios(el)[1]);
      expect(notice(el) ?? '').toBe('');
      expect(checked(el)).toBe('3');
    });

    it('recalculates the status for the chosen number of teams', () => {
      saveSession();
      const { el, click } = setup(list(16));
      expect(countStatus(el)).toContain(T.preview.status.ok);
      click(radios(el)[1]);
      expect(countStatus(el)).toContain(T.preview.status.uneven(16, 3));
    });

    it.each([
      [18, 3],
      [20, 4],
      [18, 2],
    ])('with %i players and %i teams the list is ready', (players, teamIndex) => {
      saveSession();
      const { el, click } = setup(list(players));
      click(radios(el)[teamIndex - 2]);
      expect(countStatus(el)).toContain(T.preview.status.ok);
    });

    it('says how many players are missing for the chosen number of teams', () => {
      saveSession();
      const { el, click } = setup(list(18));
      click(radios(el)[2]);
      expect(countStatus(el)).toContain(T.preview.status.tooFew(2, 20));
    });

    it('draws as many teams as were chosen', () => {
      saveSession();
      const { el, store, click, byText } = setup(list(18));
      click(radios(el)[1]);
      click(byText(T.preview.draw));
      expect(store.teams()).toHaveLength(3);
    });

    it('still draws 2 teams for somebody who is not signed in', () => {
      const { store, click, byText } = setup(list(18));
      click(byText(T.preview.draw));
      expect(store.teams()).toHaveLength(2);
    });
  });
});
