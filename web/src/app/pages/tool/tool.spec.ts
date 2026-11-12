import { TestBed } from '@angular/core/testing';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { FriendlyStore } from '../../state/friendly.store';
import { Tool } from './tool';

const list = (count: number) =>
  Array.from({ length: count }, (_, i) => `Player ${i + 1}`).join('\n');

describe('Tool', () => {
  afterEach(() => {
    document.title = '';
    document.documentElement.lang = 'en';
  });

  it.each(['en', 'es', 'pt'] as const)(
    'shows its headline and sets the page title in %s',
    (lang) => {
      TestBed.inject(I18n).setLang(lang);
      const fixture = TestBed.createComponent(Tool);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
        DICTIONARIES[lang].tool.heading,
      );
      expect(document.title).toBe(DICTIONARIES[lang].meta.tool.title);
    },
  );

  it('shows the step the store is on', () => {
    const store = TestBed.inject(FriendlyStore);
    const fixture = TestBed.createComponent(Tool);
    const el = fixture.nativeElement as HTMLElement;
    const shown = () =>
      ['app-paste-step', 'app-preview-step', 'app-result-step'].filter((tag) =>
        el.querySelector(tag),
      );

    fixture.detectChanges();
    expect(shown()).toEqual(['app-paste-step']);

    store.setRawText(list(12));
    store.continueToPreview();
    fixture.detectChanges();
    expect(shown()).toEqual(['app-preview-step']);

    store.draw(() => 0.3);
    fixture.detectChanges();
    expect(shown()).toEqual(['app-result-step']);

    store.reset();
    fixture.detectChanges();
    expect(shown()).toEqual(['app-paste-step']);
  });

  describe('the indicator of the steps', () => {
    // A step is the one in use (dark), already done (green) or still to come (plain).
    const states = (el: HTMLElement) =>
      Array.from(el.querySelectorAll('nav li > div')).map((badge) =>
        badge.className.includes('bg-secondary')
          ? 'active'
          : badge.className.includes('bg-alternative')
            ? 'done'
            : 'pending',
      );

    function open() {
      const store = TestBed.inject(FriendlyStore);
      const fixture = TestBed.createComponent(Tool);
      const el = fixture.nativeElement as HTMLElement;
      fixture.detectChanges();
      const refresh = () => fixture.detectChanges();
      return { store, el, refresh };
    }

    it('shows the first step in use, and the others to come', () => {
      const { el } = open();
      expect(states(el)).toEqual(['active', 'pending', 'pending']);
    });

    it('marks the steps already passed as done, and the one in use', () => {
      const { store, el, refresh } = open();
      store.setRawText(list(12));
      store.continueToPreview();
      refresh();
      expect(states(el)).toEqual(['done', 'active', 'pending']);
      store.draw(() => 0.3);
      refresh();
      expect(states(el)).toEqual(['done', 'done', 'active']);
    });

    it('marks the three steps as done once the teams are confirmed', () => {
      const { store, el, refresh } = open();
      store.setRawText(list(12));
      store.continueToPreview();
      store.draw(() => 0.3);
      store.confirm();
      refresh();
      expect(states(el)).toEqual(['done', 'done', 'done']);
    });

    it('goes back to the first step in use when the person starts over', () => {
      const { store, el, refresh } = open();
      store.setRawText(list(12));
      store.continueToPreview();
      store.draw(() => 0.3);
      store.confirm();
      store.reset();
      refresh();
      expect(states(el)).toEqual(['active', 'pending', 'pending']);
    });
  });

  describe('the texts that depend on the language', () => {
    it.each(['en', 'es', 'pt'] as const)(
      'shows the mode and the label of the progress in %s',
      (lang) => {
        const fixture = TestBed.createComponent(Tool);
        TestBed.inject(I18n).setLang(lang);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const { tool } = DICTIONARIES[lang];
        expect(el.textContent).toContain(tool.mode);
        expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe(tool.progressLabel);
      },
    );
  });
});
