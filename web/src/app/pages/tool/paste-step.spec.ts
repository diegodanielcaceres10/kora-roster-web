import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { saveSession } from '../../preferences/testing';
import { FriendlyStore } from '../../state/friendly.store';
import { PasteStep } from './paste-step';

const T = DICTIONARIES.es.tool;

function setup(initialText = '') {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  TestBed.inject(I18n).setLang('es');
  const store = TestBed.inject(FriendlyStore);
  store.setRawText(initialText);
  const fixture = TestBed.createComponent(PasteStep);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const textarea = () => el.querySelector('textarea') as HTMLTextAreaElement;
  const buttons = () => Array.from(el.querySelectorAll('ui-button button')) as HTMLButtonElement[];
  const named = (text: string) =>
    buttons().find((b) => b.textContent?.trim() === text) as HTMLButtonElement;
  const next = () => named(T.paste.advanced);
  const clear = () => named(T.paste.clear);
  const type = (text: string) => {
    textarea().value = text;
    textarea().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  return { fixture, el, store, textarea, next, clear, type };
}

describe('PasteStep', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
  });

  it('shows its texts in the current language', () => {
    const { el, textarea } = setup();
    expect(el.querySelector('h2')?.textContent).toContain(T.paste.title);
    expect(el.querySelector('label')?.textContent).toContain(T.paste.label);
    expect(textarea().placeholder).toBe(T.paste.placeholder);
  });

  describe('the editor', () => {
    it('is a regular textarea: no line numbers, 10 rows and it wraps long lines', () => {
      const { el, textarea, type } = setup();
      type(Array.from({ length: 12 }, (_, i) => `Jugador ${i + 1}`).join('\n'));
      expect(el.querySelector('[data-gutter]')).toBeNull();
      expect(textarea().rows).toBe(10);
      expect(textarea().hasAttribute('wrap')).toBe(false);
    });

    it('is named by the card header, so its own label is only for assistive technology', () => {
      const { el } = setup();
      expect(el.querySelector('label')?.classList.contains('sr-only')).toBe(true);
    });

    it('leaves the list empty and the cursor in the field when Clear is pressed', () => {
      const { clear, store, textarea, type, fixture } = setup();
      type('Jugador A\nJugador E');
      clear().click();
      fixture.detectChanges();
      expect(store.rawText()).toBe('');
      expect(textarea().value).toBe('');
      expect(document.activeElement).toBe(textarea());
    });

    it('has nothing to clear while the list is empty', () => {
      const { clear, type } = setup();
      expect(clear().disabled).toBe(true);
      type('Jugador A');
      expect(clear().disabled).toBe(false);
    });
  });

  it('writes what is typed into the store', () => {
    const { store, type } = setup();
    type('1. Jugador A\n2. Jugador E');
    expect(store.rawText()).toBe('1. Jugador A\n2. Jugador E');
  });

  it('shows the text the store already has, as when coming back from the preview', () => {
    const { textarea } = setup('Jugador A\nJugador E');
    expect(textarea().value).toBe('Jugador A\nJugador E');
  });

  it.each([[''], ['   \n '], ['1.'], ['- \n * ']])('keeps Continue disabled for %j', (text) => {
    const { next, type } = setup();
    type(text);
    expect(next().disabled).toBe(true);
  });

  it('enables Continue as soon as there is a name', () => {
    const { next, type } = setup();
    expect(next().textContent?.trim()).toBe(T.paste.advanced);
    type('Jugador A');
    expect(next().disabled).toBe(false);
  });

  it('moves to the preview with the players when Continue is pressed', () => {
    saveSession();
    const { store, next, type, fixture } = setup();
    type('1. Jugador A 🧤\n2. Jugador E');
    next().click();
    fixture.detectChanges();
    expect(store.step()).toBe('preview');
    expect(store.players().map((p) => p.name)).toEqual(['Jugador A', 'Jugador E']);
  });

  describe('the texts that depend on the language', () => {
    it.each(['en', 'es', 'pt'] as const)(
      'shows the guide and the count of players detected in %s',
      (lang) => {
        const { fixture, el, type } = setup();
        TestBed.inject(I18n).setLang(lang);
        const { paste } = DICTIONARIES[lang].tool;
        type('Jugador A\nJugador E');
        fixture.detectChanges();
        const text = el.textContent?.replace(/\s+/g, ' ') as string;
        expect(text).toContain(paste.detected(2));
        expect(text).toContain(paste.guide.title);
        expect(text).toContain(paste.guide.tag);
        for (const part of [
          paste.guide.step1Title,
          paste.guide.step1,
          paste.guide.step2Title,
          paste.guide.step2,
          paste.guide.step3Title,
          paste.guide.step3Before,
          paste.guide.step3After,
        ]) {
          expect(text).toContain(part);
        }
        const chips = Array.from(el.querySelectorAll('[data-guide] code')).map((c) =>
          c.textContent?.trim(),
        );
        expect(chips).toEqual([...paste.guide.step3Words]);
        type('Jugador A');
        expect(el.textContent).toContain(paste.detected(1));
      },
    );
  });

  it('numbers the three steps of the guide', () => {
    const { el } = setup();
    const tiles = Array.from(el.querySelectorAll('[data-guide] [data-step-number]')).map((n) =>
      n.textContent?.trim(),
    );
    expect(tiles).toEqual(['01', '02', '03']);
  });

  describe('drawing without going through the list', () => {
    const players = (count: number) =>
      Array.from({ length: count }, (_, i) => `Player ${i + 1}`).join('\n');
    const drawButton = (el: HTMLElement) =>
      Array.from(el.querySelectorAll('ui-button button')).find(
        (b) => b.textContent?.trim() === T.preview.draw,
      ) as HTMLButtonElement;
    const note = (el: HTMLElement) => el.querySelector('[data-draw-note]')?.textContent?.trim();

    it('offers a button to draw next to the one to continue', () => {
      const { el, next } = setup();
      expect(drawButton(el)).toBeDefined();
      expect(drawButton(el).querySelector('ui-icon[data-icon="bolt"]')).not.toBeNull();
      expect(drawButton(el).closest('ui-button')?.parentElement).toBe(
        next().closest('ui-button')?.parentElement,
      );
    });

    it('puts Continue on the left and Draw on the right of the row', () => {
      const { el, next } = setup();
      const row = next().closest('ui-button')?.parentElement as HTMLElement;
      expect(row.className).toContain('justify-between');
      expect(next().compareDocumentPosition(drawButton(el))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('paints Draw yellow and Continue white', () => {
      const { el, next } = setup();
      expect(drawButton(el).className).toContain('bg-primary');
      expect(next().className).not.toContain('bg-primary');
      expect(next().className).toContain('bg-surface');
    });

    it.each([[0], [8], [9], [11], [13], [23], [24]])(
      'is disabled with %i players, which cannot be drawn into two teams',
      (count) => {
        const { el, type } = setup();
        type(players(count));
        expect(drawButton(el).disabled).toBe(true);
      },
    );

    it.each([[10], [12], [20], [22]])('is enabled with %i players', (count) => {
      const { el, type } = setup();
      type(players(count));
      expect(drawButton(el).disabled).toBe(false);
    });

    it('draws the list and goes straight to the final result', () => {
      const { el, store, type, fixture } = setup();
      type(players(12));
      drawButton(el).click();
      fixture.detectChanges();
      expect(store.step()).toBe('result');
      expect(store.confirmed()).toBe(true);
      expect(store.players()).toHaveLength(12);
      expect(store.teams()?.map((team) => team.length)).toEqual([6, 6]);
      expect(store.isComplete()).toBe(true);
    });

    it('does not draw when it is disabled', () => {
      const { el, store, type, fixture } = setup();
      type(players(11));
      drawButton(el).click();
      fixture.detectChanges();
      expect(store.step()).toBe('paste');
      expect(store.teams()).toBeNull();
      expect(store.confirmed()).toBe(false);
    });

    it('does not change what the button to continue does', () => {
      saveSession();
      const { store, type, next, fixture } = setup();
      type(players(12));
      next().click();
      fixture.detectChanges();
      expect(store.step()).toBe('preview');
      expect(store.teams()).toBeNull();
      expect(store.confirmed()).toBe(false);
    });

    describe('says why it cannot draw yet', () => {
      it('says nothing while there is nothing in the list', () => {
        const { el } = setup();
        expect(note(el)).toBeUndefined();
      });

      it('asks for an even number when it is odd', () => {
        const { el, type } = setup();
        type(players(11));
        expect(note(el)).toBe(T.preview.status.uneven(11, 2));
      });

      it('asks for more players when there are too few', () => {
        const { el, type } = setup();
        type(players(8));
        expect(note(el)).toBe(T.preview.status.tooFew(2, 10));
      });

      it('asks for fewer players when there are too many', () => {
        const { el, type } = setup();
        type(players(24));
        expect(note(el)).toBe(T.preview.status.tooMany(2, 22));
      });

      it('says nothing once the list can be drawn', () => {
        const { el, type } = setup();
        type(players(11));
        type(players(12));
        expect(note(el)).toBeUndefined();
      });
    });

    describe('with the number of teams of the person', () => {
      beforeEach(() => saveSession());

      it('asks for a multiple of three with three teams', () => {
        const { el, store, type, fixture } = setup();
        store.setTeamCount(3);
        fixture.detectChanges();
        type(players(16));
        expect(drawButton(el).disabled).toBe(true);
        expect(note(el)).toBe(T.preview.status.uneven(16, 3));
      });

      it('draws three teams when the list fits', () => {
        const { el, store, type, fixture } = setup();
        store.setTeamCount(3);
        fixture.detectChanges();
        type(players(15));
        expect(drawButton(el).disabled).toBe(false);
        drawButton(el).click();
        fixture.detectChanges();
        expect(store.teams()?.map((team) => team.length)).toEqual([5, 5, 5]);
        expect(store.confirmed()).toBe(true);
      });
    });
  });

  describe('continuing to review the list', () => {
    const notice = (el: HTMLElement) =>
      el
        .querySelector('[data-review-notice] [role="status"]')
        ?.textContent?.replace(/\s+/g, ' ')
        .trim();

    describe('without an account', () => {
      it('shows a lock instead of an arrow, and says nothing until it is touched', () => {
        const { el, next, type } = setup();
        type('Jugador A\nJugador E');
        expect(next().disabled).toBe(false);
        expect(next().querySelector('ui-icon[data-icon="lock"]')).not.toBeNull();
        expect(next().querySelector('ui-icon[data-icon="arrow-right"]')).toBeNull();
        expect(notice(el) ?? '').toBe('');
      });

      it('does not move on when it is touched, and offers to sign in', () => {
        const { el, store, next, type, fixture } = setup();
        type('Jugador A\nJugador E');
        next().click();
        fixture.detectChanges();
        expect(store.step()).toBe('paste');
        expect(store.players()).toEqual([]);
        expect(notice(el)).toContain(T.paste.reviewSignIn);
        expect(el.querySelector('[data-review-notice] a')?.getAttribute('href')).toBe(
          '/es/account',
        );
      });

      it('stays disabled while there are no names, as before', () => {
        const { next, type } = setup();
        type('1.');
        expect(next().disabled).toBe(true);
      });
    });

    describe('with an account', () => {
      beforeEach(() => saveSession());

      it('shows an arrow, not a lock, and moves to the preview', () => {
        const { el, store, next, type, fixture } = setup();
        type('Jugador A\nJugador E');
        expect(next().querySelector('ui-icon[data-icon="arrow-right"]')).not.toBeNull();
        expect(next().querySelector('ui-icon[data-icon="lock"]')).toBeNull();
        next().click();
        fixture.detectChanges();
        expect(store.step()).toBe('preview');
        expect(notice(el) ?? '').toBe('');
      });
    });
  });
});
