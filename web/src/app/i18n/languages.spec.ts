import {
  DEFAULT_LANG,
  isLang,
  pickLanguage,
  SUPPORTED_LANGS,
  switchLanguageUrl,
} from './languages';

describe('languages', () => {
  it('supports English, Spanish and Portuguese, with English as the default', () => {
    expect([...SUPPORTED_LANGS]).toEqual(['en', 'es', 'pt']);
    expect(DEFAULT_LANG).toBe('en');
  });

  it.each(['en', 'es', 'pt'])('recognizes %s as a language', (value) => {
    expect(isLang(value)).toBe(true);
  });

  it.each(['fr', 'EN', 'es-AR', '', 'design-system'])('rejects %j as a language', (value) => {
    expect(isLang(value)).toBe(false);
  });
});

describe('pickLanguage', () => {
  it('takes the first supported language in the browser preference order', () => {
    expect(pickLanguage(['fr', 'pt-BR', 'es'])).toBe('pt');
  });

  it.each([
    [['es-AR'], 'es'],
    [['PT-br'], 'pt'],
    [['en-GB', 'es'], 'en'],
    [['ES'], 'es'],
  ])('reads the main part of %j', (candidates, expected) => {
    expect(pickLanguage(candidates)).toBe(expected);
  });

  it('falls back to English when nothing is supported or nothing is given', () => {
    expect(pickLanguage(['fr', 'de-DE'])).toBe('en');
    expect(pickLanguage([])).toBe('en');
    expect(pickLanguage(undefined)).toBe('en');
  });
});

describe('switchLanguageUrl', () => {
  it.each([
    ['/es/amistoso', 'pt', '/pt/amistoso'],
    ['/es', 'pt', '/pt'],
    ['/en/amistoso', 'es', '/es/amistoso'],
    ['/es?x=1#top', 'pt', '/pt?x=1#top'],
    ['/es/amistoso?x=1', 'en', '/en/amistoso?x=1'],
  ])('moves %s to %s as %s', (url, lang, expected) => {
    expect(switchLanguageUrl(url, lang as 'en' | 'es' | 'pt')).toBe(expected);
  });

  it.each([['/'], ['/design-system'], ['/espana'], ['/xyz/amistoso']])(
    'sends %s to the landing of the chosen language',
    (url) => {
      expect(switchLanguageUrl(url, 'pt')).toBe('/pt');
    },
  );
});
