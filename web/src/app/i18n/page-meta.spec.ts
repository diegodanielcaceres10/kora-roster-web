import { TestBed } from '@angular/core/testing';
import { DICTIONARIES } from './dictionaries';
import { I18n } from './i18n';
import { PageMeta } from './page-meta';
import { SITE_URL } from './site';

const description = () =>
  document.head.querySelector('meta[name="description"]')?.getAttribute('content');
const links = (rel: string) =>
  Array.from(document.head.querySelectorAll(`link[rel="${rel}"]`)) as HTMLLinkElement[];

function setup(siteUrl?: string) {
  if (siteUrl !== undefined) {
    TestBed.configureTestingModule({ providers: [{ provide: SITE_URL, useValue: siteUrl }] });
  }
  return { i18n: TestBed.inject(I18n), pageMeta: TestBed.inject(PageMeta) };
}

describe('PageMeta', () => {
  afterEach(() => {
    document.head
      .querySelectorAll('link[data-kora-seo], meta[name="description"]')
      .forEach((el) => el.remove());
    document.title = '';
    document.documentElement.lang = 'en';
  });

  it('sets the title and description of the page in the current language', () => {
    const { i18n, pageMeta } = setup();
    i18n.setLang('es');
    pageMeta.apply('tool');
    expect(document.title).toBe(DICTIONARIES.es.meta.tool.title);
    expect(description()).toBe(DICTIONARIES.es.meta.tool.description);
  });

  it('follows the language and the kind of page', () => {
    const { i18n, pageMeta } = setup();
    pageMeta.apply('landing');
    expect(document.title).toBe(DICTIONARIES.en.meta.landing.title);
    i18n.setLang('pt');
    pageMeta.apply('landing');
    expect(document.title).toBe(DICTIONARIES.pt.meta.landing.title);
    expect(description()).toBe(DICTIONARIES.pt.meta.landing.description);
  });

  it('writes no canonical or alternate links while SITE_URL is empty', () => {
    const { pageMeta } = setup();
    pageMeta.apply('landing');
    expect(links('canonical')).toHaveLength(0);
    expect(links('alternate')).toHaveLength(0);
  });

  it('writes the canonical and the alternates of the landing once SITE_URL is set', () => {
    const { i18n, pageMeta } = setup('https://kora.test');
    i18n.setLang('es');
    pageMeta.apply('landing');
    expect(links('canonical').map((l) => l.href)).toEqual(['https://kora.test/es']);
    expect(links('alternate').map((l) => [l.hreflang, l.href])).toEqual([
      ['en', 'https://kora.test/en'],
      ['es', 'https://kora.test/es'],
      ['pt', 'https://kora.test/pt'],
      ['x-default', 'https://kora.test/en'],
    ]);
  });

  it('points the links of the tool page to the tool page', () => {
    const { i18n, pageMeta } = setup('https://kora.test');
    i18n.setLang('pt');
    pageMeta.apply('tool');
    expect(links('canonical')[0].href).toBe('https://kora.test/pt/amistoso');
    expect(links('alternate').find((l) => l.hreflang === 'x-default')?.href).toBe(
      'https://kora.test/en/amistoso',
    );
  });

  it('replaces the links instead of piling them up', () => {
    const { i18n, pageMeta } = setup('https://kora.test');
    pageMeta.apply('landing');
    i18n.setLang('pt');
    pageMeta.apply('tool');
    expect(links('canonical')).toHaveLength(1);
    expect(links('alternate')).toHaveLength(4);
  });

  it('ignores a trailing slash in SITE_URL', () => {
    const { pageMeta } = setup('https://kora.test/');
    pageMeta.apply('landing');
    expect(links('canonical')[0].href).toBe('https://kora.test/en');
  });
});
