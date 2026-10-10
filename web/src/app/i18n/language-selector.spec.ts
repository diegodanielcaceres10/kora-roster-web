import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { I18n } from './i18n';
import { LanguageSelector } from './language-selector';

function setup(lang: 'en' | 'es' | 'pt', url = '/es/amistoso') {
  const router = { url, navigateByUrl: vi.fn() };
  TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: router }] });
  TestBed.inject(I18n).setLang(lang);
  const fixture = TestBed.createComponent(LanguageSelector);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const radios = () => Array.from(el.querySelectorAll('[role="radio"]')) as HTMLButtonElement[];
  const pick = (label: string) => {
    radios()
      .find((r) => r.textContent?.trim() === label)
      ?.click();
    fixture.detectChanges();
  };
  return { fixture, el, router, radios, pick };
}

describe('LanguageSelector', () => {
  afterEach(() => {
    document.documentElement.lang = 'en';
  });

  it('offers EN, ES and PT in a group named in the current language', () => {
    const { el, radios } = setup('es');
    expect(radios().map((r) => r.textContent?.trim())).toEqual(['EN', 'ES', 'PT']);
    expect(el.querySelector('[role="radiogroup"]')?.getAttribute('aria-label')).toBe('Idioma');
  });

  it('names the group in English when the page is in English', () => {
    const { el } = setup('en');
    expect(el.querySelector('[role="radiogroup"]')?.getAttribute('aria-label')).toBe('Language');
  });

  it('marks the current language as checked', () => {
    const { radios } = setup('pt');
    expect(radios().map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);
  });

  it('goes to the same place in the chosen language', () => {
    const { router, pick } = setup('es', '/es/amistoso');
    pick('PT');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/pt/amistoso');
  });

  it('keeps the query string when it changes language', () => {
    const { router, pick } = setup('en', '/en?ref=wa');
    pick('ES');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/es?ref=wa');
  });

  it('does not navigate when the current language is chosen again', () => {
    const { router, pick } = setup('es');
    pick('ES');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
