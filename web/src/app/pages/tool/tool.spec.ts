import { TestBed } from '@angular/core/testing';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { AmistosoStore } from '../../state/amistoso.store';
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
    const store = TestBed.inject(AmistosoStore);
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
});
