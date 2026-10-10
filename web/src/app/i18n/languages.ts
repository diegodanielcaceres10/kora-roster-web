export const SUPPORTED_LANGS = ['en', 'es', 'pt'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

export function isLang(value: string): value is Lang {
  return (SUPPORTED_LANGS as readonly string[]).includes(value);
}

// Reads the main part of each browser language ("pt-BR" -> "pt") in preference order.
export function pickLanguage(candidates: readonly string[] | undefined): Lang {
  for (const candidate of candidates ?? []) {
    const main = candidate.toLowerCase().split('-')[0];
    if (isLang(main)) return main;
  }
  return DEFAULT_LANG;
}

const LANG_PREFIX = new RegExp(`^/(?:${SUPPORTED_LANGS.join('|')})(?=[/?#]|$)`);

// Keeps the rest of the URL (path, query, fragment) and swaps only the language segment.
export function switchLanguageUrl(url: string, lang: Lang): string {
  return LANG_PREFIX.test(url) ? url.replace(LANG_PREFIX, `/${lang}`) : `/${lang}`;
}
