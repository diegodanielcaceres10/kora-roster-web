import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { Preferences } from '../../preferences/preferences';
import { saveSession, TEST_PREFERENCES } from '../../preferences/testing';
import { FriendlyStore } from '../../state/friendly.store';
import { PreviewStep } from './preview-step';

const T = DICTIONARIES.es.tool;
const list = (count: number) =>
  Array.from({ length: count }, (_, i) => `Player ${i + 1}`).join('\n');

function setup(text: string, preferences?: Preferences) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  if (preferences) saveSession(preferences);
  TestBed.inject(I18n).setLang('es');
  const store = TestBed.inject(FriendlyStore);
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
      const { rows } = setup('Jugador A\nJugador E\nJugador G');
      expect(rows().map((r) => r.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
        expect.stringMatching(/^01\s*Jugador A/),
        expect.stringMatching(/^02\s*Jugador E/),
        expect.stringMatching(/^03\s*Jugador G/),
      ]);
    });

    it('labels only the goalkeepers', () => {
      const { rows } = setup('Jugador A 🧤\nJugador E');
      expect(rows()[0].querySelector('ui-badge')?.textContent).toContain(T.preview.goalkeeper);
      expect(rows()[1].querySelector('ui-badge')).toBeNull();
    });
  });

  describe('count and status', () => {
    it('shows the total of the list and that it is ready', () => {
      const { el } = setup(list(12));
      expect(el.textContent).toContain(T.preview.listSubtitle(12));
      expect(el.querySelector('p[role="status"]')?.textContent).toContain(T.preview.status.ok);
      expect(el.textContent).toContain(T.preview.readyDetail(12));
    });

    it('does not say the list is ready when it is not', () => {
      const { el } = setup(list(11));
      expect(el.textContent).toContain(T.preview.listSubtitle(11));
      expect(el.textContent).not.toContain(T.preview.readyDetail(11));
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

  describe('the figures', () => {
    const stats = (el: HTMLElement) =>
      Object.fromEntries(
        Array.from(el.querySelectorAll('ui-stat')).map((stat) => [
          stat.querySelector('[data-label]')?.textContent?.trim(),
          {
            value: stat.querySelector('[data-value]')?.textContent?.trim(),
            note: stat.querySelector('[data-note]')?.textContent?.trim() ?? '',
          },
        ]),
      );

    // The teams are called "Team 1", "Team 2"... on the next screen and in the message, so the
    // tile names them the same way.
    it('names the teams by their numbers', () => {
      const { el } = setup(list(12));
      expect(stats(el)[T.preview.teamsTile]).toEqual({ value: '2', note: '1 y 2' });
    });

    it('shows the size of each team when they come out even', () => {
      const { el } = setup(list(12));
      expect(stats(el)[T.preview.perTeam]).toEqual({
        value: '6 vs 6',
        note: T.preview.evenTeams,
      });
    });

    it('shows the two sizes when they would come out uneven', () => {
      const { el } = setup(list(11));
      expect(stats(el)[T.preview.perTeam]).toEqual({
        value: '5 vs 6',
        note: T.preview.unevenTeams,
      });
    });

    it('follows the number of teams chosen', () => {
      saveSession(); // more than two teams are for people with an account
      const { fixture, el, store } = setup(list(18));
      store.setTeamCount(3);
      fixture.detectChanges();
      expect(stats(el)[T.preview.teamsTile]).toEqual({ value: '3', note: '1, 2 y 3' });
      expect(stats(el)[T.preview.perTeam]).toEqual({ value: '6', note: T.preview.evenTeams });
    });

    it('shows a range of sizes with more than two teams that do not divide', () => {
      saveSession(); // more than two teams are for people with an account
      const { fixture, el, store } = setup(list(17));
      store.setTeamCount(3);
      fixture.detectChanges();
      expect(stats(el)[T.preview.perTeam]).toEqual({ value: '5–6', note: T.preview.unevenTeams });
    });

    it('counts the goalkeepers, and says there is one for each team when it is so', () => {
      const { el } = setup(`Jugador A 🧤\nJugador E (gk)\n${list(10)}`);
      expect(stats(el)[T.preview.goalkeepers]).toEqual({
        value: '2',
        note: T.preview.onePerTeam,
      });
    });

    it('says nothing about goalkeepers per team when the numbers do not match', () => {
      const { el } = setup(`Jugador A 🧤\n${list(11)}`);
      expect(stats(el)[T.preview.goalkeepers]).toEqual({ value: '1', note: '' });
    });
  });

  describe('buttons', () => {
    it('keeps Draw disabled while the count is not valid', () => {
      const { byText } = setup(list(11));
      expect(byText(T.preview.drawTeams).disabled).toBe(true);
    });

    it('draws the teams and moves to the result when the count is valid', () => {
      const { store, byText, click } = setup(list(12));
      expect(byText(T.preview.drawTeams).disabled).toBe(false);
      click(byText(T.preview.drawTeams));
      expect(store.step()).toBe('result');
      expect(store.teams()).not.toBeNull();
    });

    it('goes back to the pasted text', () => {
      const { store, byText, click } = setup(list(12));
      click(byText(T.preview.backToList));
      expect(store.step()).toBe('paste');
    });
  });

  describe('continuing without drawing', () => {
    const manualNotice = (el: HTMLElement) =>
      el
        .querySelector('[data-manual-notice] [role="status"]')
        ?.textContent?.replace(/\s+/g, ' ')
        .trim();

    it('stacks Draw teams, Continue and Back, in that order', () => {
      const { byText } = setup(list(12));
      const draw = byText(T.preview.drawTeams);
      const next = byText(T.preview.continue);
      const back = byText(T.preview.backToList);
      expect(draw.compareDocumentPosition(next)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(next.compareDocumentPosition(back)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
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
        expect(button.querySelector('ui-icon[data-icon="arrow-right"]')).not.toBeNull();
        expect(button.querySelector('ui-icon[data-icon="lock"]')).toBeNull();
        expect(manualNotice(el) ?? '').toBe('');
      });
    });

    describe('without an account', () => {
      it('shows a lock and says nothing until it is touched', () => {
        const { el, byText } = setup(list(12));
        const button = byText(T.preview.continue);
        expect(button.disabled).toBe(false);
        expect(button.querySelector('ui-icon[data-icon="lock"]')).not.toBeNull();
        expect(button.querySelector('ui-icon[data-icon="arrow-right"]')).toBeNull();
        expect(manualNotice(el) ?? '').toBe('');
      });

      it('does not move on when it is touched, and offers to sign in', () => {
        const { el, store, byText, click } = setup(list(12));
        click(byText(T.preview.continue));
        expect(store.step()).toBe('preview');
        expect(store.teams()).toBeNull();
        expect(store.pool()).toEqual([]);
        expect(manualNotice(el)).toContain(T.preview.manualSignIn);
        expect(el.querySelector('[data-manual-notice] a')?.getAttribute('href')).toBe(
          '/es/account',
        );
      });

      it('still draws', () => {
        const { store, byText, click } = setup(list(12));
        click(byText(T.preview.drawTeams));
        expect(store.step()).toBe('result');
        expect(store.isComplete()).toBe(true);
      });
    });
  });

  describe('removing and the goalkeeper glove', () => {
    it('removes only the player whose cross is pressed', () => {
      const { names, byLabel, click } = setup('Jugador A\nJugador E\nJugador G');
      click(byLabel(T.preview.remove('Jugador E')));
      expect(names()).toEqual(['Jugador A', 'Jugador G']);
    });

    it('toggles the goalkeeper mark and tells which action the button will do', () => {
      const { store, byLabel, click } = setup('Jugador A\nJugador E');
      const mark = byLabel(T.preview.markGoalkeeper('Jugador E'));
      expect(mark.getAttribute('aria-pressed')).toBe('false');
      click(mark);
      expect(store.players()[1].isGoalkeeper).toBe(true);
      const unmark = byLabel(T.preview.unmarkGoalkeeper('Jugador E'));
      expect(unmark.getAttribute('aria-pressed')).toBe('true');
      click(unmark);
      expect(store.players()[1].isGoalkeeper).toBe(false);
    });
  });

  describe('editing a name', () => {
    it('opens a field with the current name and focuses it', async () => {
      const { fixture, el, editor, byLabel, click } = setup('Jugador A\nJugador E');
      click(byLabel(T.preview.edit('Jugador E')));
      await fixture.whenStable();
      expect(editor()?.value).toBe('Jugador E');
      const label = el.querySelector('label.sr-only') as HTMLLabelElement;
      expect(label.textContent?.trim()).toBe(T.preview.nameLabel);
      expect(label.control).toBe(editor());
      expect(document.activeElement).toBe(editor());
    });

    it('saves with Enter and closes the field', () => {
      const { byLabel, click, press, names, editor, type } = setup('Jugador A\nJugador E');
      click(byLabel(T.preview.edit('Jugador E')));
      type('Jugador F');
      press('Enter');
      expect(names()).toEqual(['Jugador A', 'Jugador F']);
      expect(editor()).toBeNull();
    });

    it('cancels with Escape, even if a blur arrives while the field is closing', () => {
      const { fixture, editor, byLabel, click, names, type } = setup('Jugador A\nJugador E');
      click(byLabel(T.preview.edit('Jugador E')));
      const field = editor() as HTMLInputElement;
      type('Changed');
      field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      // Browsers can fire the blur before Angular removes the field from the page.
      field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      fixture.detectChanges();
      expect(names()).toEqual(['Jugador A', 'Jugador E']);
      expect(editor()).toBeNull();
    });

    it('keeps the old name when it is left empty, and closes the field', () => {
      const { byLabel, click, press, names, editor, type } = setup('Jugador A\nJugador E');
      click(byLabel(T.preview.edit('Jugador E')));
      type('   ');
      press('Enter');
      expect(names()).toEqual(['Jugador A', 'Jugador E']);
      expect(editor()).toBeNull();
    });

    it('saves when the field loses focus', () => {
      const { byLabel, click, blur, names, type } = setup('Jugador A\nJugador E');
      click(byLabel(T.preview.edit('Jugador E')));
      type('Jugador F');
      blur();
      expect(names()).toEqual(['Jugador A', 'Jugador F']);
    });

    it('edits one row at a time', () => {
      const { el, byLabel, click } = setup('Jugador A\nJugador E');
      click(byLabel(T.preview.edit('Jugador A')));
      click(byLabel(T.preview.edit('Jugador E')));
      expect(el.querySelectorAll('input')).toHaveLength(1);
    });
  });

  describe('the team size', () => {
    it('has no notice about a usual size: only the list and the teams decide what is said', () => {
      const { el } = setup(list(12), TEST_PREFERENCES);
      expect(el.textContent).not.toContain('Sueles jugar');
    });

    it('does not stop them from drawing a list that is valid', () => {
      const { byText } = setup(list(12), TEST_PREFERENCES);
      expect(byText(T.preview.drawTeams).disabled).toBe(false);
    });

    it('says only what is wrong with the list when it is not valid', () => {
      const { el } = setup(list(11), TEST_PREFERENCES);
      expect(el.textContent).toContain(T.preview.status.uneven(11, 2));
      expect(el.textContent).not.toContain('Sueles jugar');
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
      const hasLock = (r: HTMLElement) => r.querySelector('ui-icon[data-icon="lock"]') !== null;
      expect(radios(el).map(hasLock)).toEqual([false, true, true, true, true]);
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
      expect(el.querySelector('app-lock-notice a')?.getAttribute('href')).toBe('/es/account');
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
      click(byText(T.preview.drawTeams));
      expect(store.teams()).toHaveLength(3);
    });

    it('still draws 2 teams for somebody who is not signed in', () => {
      const { store, click, byText } = setup(list(18));
      click(byText(T.preview.drawTeams));
      expect(store.teams()).toHaveLength(2);
    });
  });

  describe('the texts that depend on the language', () => {
    it.each(['en', 'es', 'pt'] as const)(
      'shows the settings, the figures and the headings of the list in %s',
      (lang) => {
        const { fixture, el } = setup(list(12));
        TestBed.inject(I18n).setLang(lang);
        fixture.detectChanges();
        const { preview } = DICTIONARIES[lang].tool;
        const text = el.textContent?.replace(/\s+/g, ' ') as string;
        for (const expected of [
          preview.settings,
          preview.settingsTag,
          preview.listTitle,
          preview.listSubtitle(12),
          preview.teamsLabel,
          preview.teamsTile,
          preview.perTeam,
          preview.goalkeepers,
          preview.readyDetail(12),
          preview.drawTeams,
          preview.continue,
          preview.backToList,
        ]) {
          expect(text).toContain(expected);
        }
      },
    );
  });
});
