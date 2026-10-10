import { TestBed } from '@angular/core/testing';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { Tool } from './tool';

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
        DICTIONARIES[lang].meta.tool.title,
      );
      expect(document.title).toBe(DICTIONARIES[lang].meta.tool.title);
    },
  );
});
