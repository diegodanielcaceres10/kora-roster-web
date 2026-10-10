import { TestBed } from '@angular/core/testing';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { Landing } from './landing';

describe('Landing', () => {
  afterEach(() => {
    document.title = '';
    document.documentElement.lang = 'en';
  });

  it.each(['en', 'es', 'pt'] as const)(
    'shows its headline and sets the page title in %s',
    (lang) => {
      TestBed.inject(I18n).setLang(lang);
      const fixture = TestBed.createComponent(Landing);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
        DICTIONARIES[lang].meta.landing.title,
      );
      expect(document.title).toBe(DICTIONARIES[lang].meta.landing.title);
    },
  );
});
