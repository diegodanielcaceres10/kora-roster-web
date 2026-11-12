import { TestBed } from '@angular/core/testing';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { FriendlyStore } from '../../state/friendly.store';
import { PasteStep } from './paste-step';

const T = DICTIONARIES.es.tool;

function setup(initialText = '') {
  TestBed.inject(I18n).setLang('es');
  const store = TestBed.inject(FriendlyStore);
  store.setRawText(initialText);
  const fixture = TestBed.createComponent(PasteStep);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const textarea = () => el.querySelector('textarea') as HTMLTextAreaElement;
  const next = () => el.querySelector('ui-button button') as HTMLButtonElement;
  const type = (text: string) => {
    textarea().value = text;
    textarea().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  return { fixture, el, store, textarea, next, type };
}

describe('PasteStep', () => {
  afterEach(() => {
    document.documentElement.lang = 'en';
  });

  it('shows its texts in the current language', () => {
    const { el, textarea } = setup();
    expect(el.querySelector('h2')?.textContent).toContain(T.paste.title);
    expect(el.querySelector('label')?.textContent).toContain(T.paste.label);
    expect(textarea().placeholder).toBe(T.paste.placeholder);
    expect(el.textContent).toContain(T.paste.hint);
  });

  it('writes what is typed into the store', () => {
    const { store, type } = setup();
    type('1. Diego\n2. Mati');
    expect(store.rawText()).toBe('1. Diego\n2. Mati');
  });

  it('shows the text the store already has, as when coming back from the preview', () => {
    const { textarea } = setup('Diego\nMati');
    expect(textarea().value).toBe('Diego\nMati');
  });

  it.each([[''], ['   \n '], ['1.'], ['- \n * ']])('keeps Continue disabled for %j', (text) => {
    const { next, type } = setup();
    type(text);
    expect(next().disabled).toBe(true);
  });

  it('enables Continue as soon as there is a name', () => {
    const { next, type } = setup();
    expect(next().textContent?.trim()).toBe(T.paste.continue);
    type('Diego');
    expect(next().disabled).toBe(false);
  });

  it('moves to the preview with the players when Continue is pressed', () => {
    const { store, next, type, fixture } = setup();
    type('1. Diego 🧤\n2. Mati');
    next().click();
    fixture.detectChanges();
    expect(store.step()).toBe('preview');
    expect(store.players().map((p) => p.name)).toEqual(['Diego', 'Mati']);
  });

  describe('the texts that depend on the language', () => {
    it.each(['en', 'es', 'pt'] as const)(
      'shows the guide and the count of players detected in %s',
      (lang) => {
        const { fixture, el, type } = setup();
        TestBed.inject(I18n).setLang(lang);
        const { paste } = DICTIONARIES[lang].tool;
        type('Diego\nMati');
        fixture.detectChanges();
        const text = el.textContent?.replace(/\s+/g, ' ') as string;
        expect(text).toContain(paste.detected(2));
        expect(text).toContain(paste.guide.title);
        expect(text).toContain(paste.guide.step1);
        expect(text).toContain(paste.guide.step2);
        expect(text).toContain(
          `${paste.guide.step3Before} ${paste.guide.step3Word} ${paste.guide.step3After}`,
        );
        type('Diego');
        expect(el.textContent).toContain(paste.detected(1));
      },
    );
  });
});
