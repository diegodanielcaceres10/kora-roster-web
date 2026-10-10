import { TestBed } from '@angular/core/testing';
import { DICTIONARIES } from './dictionaries';
import { I18n } from './i18n';

describe('I18n', () => {
  afterEach(() => {
    document.documentElement.lang = 'en';
  });

  it('starts in English', () => {
    const i18n = TestBed.inject(I18n);
    expect(i18n.lang()).toBe('en');
    expect(i18n.t()).toBe(DICTIONARIES.en);
  });

  it('serves the dictionary of the language it is set to', () => {
    const i18n = TestBed.inject(I18n);
    i18n.setLang('es');
    expect(i18n.t()).toBe(DICTIONARIES.es);
    i18n.setLang('pt');
    expect(i18n.t()).toBe(DICTIONARIES.pt);
  });

  it('keeps the lang attribute of the html element in sync', () => {
    const i18n = TestBed.inject(I18n);
    i18n.setLang('pt');
    expect(document.documentElement.lang).toBe('pt');
    i18n.setLang('es');
    expect(document.documentElement.lang).toBe('es');
  });
});
