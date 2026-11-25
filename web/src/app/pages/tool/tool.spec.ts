import { TestBed } from '@angular/core/testing';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { saveSession } from '../../preferences/testing';
import { FriendlyStore } from '../../state/friendly.store';
import { Tool } from './tool';

const list = (count: number) =>
  Array.from({ length: count }, (_, i) => `Player ${i + 1}`).join('\n');

describe('Tool', () => {
  afterEach(() => {
    localStorage.clear();
    document.title = '';
    document.documentElement.lang = 'en';
  });

  it.each(['en', 'es', 'pt'] as const)(
    'shows the title of the first step and sets the page title in %s',
    (lang) => {
      TestBed.inject(I18n).setLang(lang);
      const fixture = TestBed.createComponent(Tool);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
        DICTIONARIES[lang].tool.stepHeader.paste.title,
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

  describe('the title of the page', () => {
    it('follows the step the person is on, with its explanation', () => {
      const store = TestBed.inject(FriendlyStore);
      const fixture = TestBed.createComponent(Tool);
      const el = fixture.nativeElement as HTMLElement;
      TestBed.inject(I18n).setLang('es');
      const { stepHeader } = DICTIONARIES.es.tool;
      const shown = () => [
        el.querySelector('h1')?.textContent?.trim(),
        el.querySelector('header p')?.textContent?.trim(),
      ];

      fixture.detectChanges();
      expect(shown()).toEqual([stepHeader.paste.title, stepHeader.paste.subtitle]);

      store.setRawText(list(12));
      store.continueToPreview();
      fixture.detectChanges();
      expect(shown()).toEqual([stepHeader.preview.title, stepHeader.preview.subtitle]);

      store.draw(() => 0.3);
      fixture.detectChanges();
      expect(shown()).toEqual([stepHeader.result.title, stepHeader.result.subtitle]);

      store.confirm();
      fixture.detectChanges();
      expect(shown()).toEqual([stepHeader.confirmed.title, stepHeader.confirmed.subtitle]);
    });
  });

  describe('the header of the confirmed teams', () => {
    function confirmed(text: string) {
      const store = TestBed.inject(FriendlyStore);
      TestBed.inject(I18n).setLang('es');
      store.setRawText(text);
      store.continueToPreview();
      store.draw(() => 0.3);
      store.confirm();
      const fixture = TestBed.createComponent(Tool);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    }
    const tiles = (el: HTMLElement) =>
      Array.from(el.querySelectorAll('header ui-stat')).map((stat) => ({
        label: stat.querySelector('[data-label]')?.textContent?.trim(),
        value: stat.querySelector('[data-value]')?.textContent?.trim(),
      }));

    it('colors the last word of the title', () => {
      const el = confirmed(list(12));
      const title = DICTIONARIES.es.tool.stepHeader.confirmed.title;
      expect(el.querySelector('h1 span')?.textContent?.trim()).toBe(title.split(' ').pop());
    });

    it('counts the players and the goalkeepers beside the title', () => {
      const el = confirmed('Jugador A 🧤\nJugador E 🧤\n' + list(10));
      const { result } = DICTIONARIES.es.tool;
      expect(tiles(el)).toEqual([
        { label: result.statPlayers, value: '12' },
        { label: result.statGoalkeepers, value: '2' },
      ]);
    });

    it('shows no figures before the teams are confirmed', () => {
      const store = TestBed.inject(FriendlyStore);
      store.setRawText(list(12));
      const fixture = TestBed.createComponent(Tool);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('header ui-stat')).toBeNull();
      expect(fixture.nativeElement.querySelector('h1 span')).toBeNull();
    });
  });

  describe('the indicator of the steps', () => {
    // Only people with an account go through the steps, so only they see it.
    beforeEach(() => saveSession());

    // A step is the one in use (amber), already done (with a check) or still to come (plain).
    const states = (el: HTMLElement) =>
      Array.from(el.querySelectorAll('nav li [data-step]')).map((step) =>
        step.getAttribute('aria-current') === 'step'
          ? 'active'
          : step.querySelector('ui-icon[data-icon="check"]')
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

    it('drops the steps once the teams are confirmed, as there is nothing left to follow', () => {
      const { store, el, refresh } = open();
      store.setRawText(list(12));
      store.continueToPreview();
      store.draw(() => 0.3);
      expect(el.querySelector('nav')).not.toBeNull();
      store.confirm();
      refresh();
      expect(el.querySelector('nav')).toBeNull();
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
      'names the steps and the progress in %s',
      (lang) => {
        saveSession();
        const fixture = TestBed.createComponent(Tool);
        TestBed.inject(I18n).setLang(lang);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const { tool } = DICTIONARIES[lang];
        expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe(tool.progressLabel);
        const text = el.querySelector('nav')?.textContent?.replace(/\s+/g, ' ') as string;
        expect(text).toContain(`1 ${tool.steps.list}`);
        expect(text).toContain(`2 ${tool.steps.review}`);
        expect(text).toContain(`3 ${tool.steps.teams}`);
      },
    );
  });

  describe('the indicator of the steps without an account', () => {
    function open() {
      const store = TestBed.inject(FriendlyStore);
      const fixture = TestBed.createComponent(Tool);
      const el = fixture.nativeElement as HTMLElement;
      fixture.detectChanges();
      return { store, el, refresh: () => fixture.detectChanges() };
    }

    it('is not shown, because there are no steps to go through', () => {
      const { el } = open();
      expect(el.querySelector('nav')).toBeNull();
      expect(el.querySelector('h1')).not.toBeNull();
    });

    it('is not shown either after drawing straight to the final result', () => {
      const { store, el, refresh } = open();
      store.setRawText(list(12));
      store.continueToPreview();
      store.draw(() => 0.3);
      store.confirm();
      refresh();
      expect(el.querySelector('nav')).toBeNull();
    });
  });
});
