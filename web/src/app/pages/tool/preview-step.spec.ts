import { TestBed } from '@angular/core/testing';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { AmistosoStore } from '../../state/amistoso.store';
import { PreviewStep } from './preview-step';

const T = DICTIONARIES.es.tool;
const list = (count: number) =>
  Array.from({ length: count }, (_, i) => `Player ${i + 1}`).join('\n');

function setup(text: string) {
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
    editor()?.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };
  const names = () => store.players().map((p) => p.name);
  return { fixture, el, store, rows, byLabel, byText, editor, click, press, blur, names };
}

describe('PreviewStep', () => {
  afterEach(() => {
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
      expect(el.querySelector('[role="status"]')?.textContent).toContain(T.preview.status.ok);
    });

    it.each([
      [9, T.preview.status.tooFew(1)],
      [11, T.preview.status.odd(11)],
      [23, T.preview.status.tooMany(1)],
    ])('explains what is wrong with %i players', (count, message) => {
      const { el } = setup(list(count));
      expect(el.querySelector('[role="status"]')?.textContent).toContain(message);
    });

    it('updates when a player is removed', () => {
      const { el, rows, byLabel, click } = setup(list(11));
      click(byLabel(T.preview.remove('Player 3')));
      expect(rows()).toHaveLength(10);
      expect(el.querySelector('[role="status"]')?.textContent).toContain(T.preview.status.ok);
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
      const { fixture, editor, byLabel, click } = setup('Diego\nMati');
      click(byLabel(T.preview.edit('Mati')));
      await fixture.whenStable();
      expect(editor()?.value).toBe('Mati');
      expect(editor()?.getAttribute('aria-label')).toBe(T.preview.nameLabel);
      expect(document.activeElement).toBe(editor());
    });

    it('saves with Enter and closes the field', () => {
      const { editor, byLabel, click, press, names } = setup('Diego\nMati');
      click(byLabel(T.preview.edit('Mati')));
      (editor() as HTMLInputElement).value = 'Matías';
      press('Enter');
      expect(names()).toEqual(['Diego', 'Matías']);
      expect(editor()).toBeNull();
    });

    it('cancels with Escape, even if a blur arrives while the field is closing', () => {
      const { fixture, editor, byLabel, click, names } = setup('Diego\nMati');
      click(byLabel(T.preview.edit('Mati')));
      const field = editor() as HTMLInputElement;
      field.value = 'Changed';
      field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      // Browsers can fire the blur before Angular removes the field from the page.
      field.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(names()).toEqual(['Diego', 'Mati']);
      expect(editor()).toBeNull();
    });

    it('keeps the old name when it is left empty, and closes the field', () => {
      const { editor, byLabel, click, press, names } = setup('Diego\nMati');
      click(byLabel(T.preview.edit('Mati')));
      (editor() as HTMLInputElement).value = '   ';
      press('Enter');
      expect(names()).toEqual(['Diego', 'Mati']);
      expect(editor()).toBeNull();
    });

    it('saves when the field loses focus', () => {
      const { editor, byLabel, click, blur, names } = setup('Diego\nMati');
      click(byLabel(T.preview.edit('Mati')));
      (editor() as HTMLInputElement).value = 'Matías';
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
});
