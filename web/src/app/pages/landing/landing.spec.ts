import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { SITE_URL } from '../../i18n/site';
import { Landing } from './landing';

const LANGS = ['en', 'es', 'pt'] as const;
type Lang = (typeof LANGS)[number];

function setup(lang: Lang, siteUrl?: string) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      ...(siteUrl === undefined ? [] : [{ provide: SITE_URL, useValue: siteUrl }]),
    ],
  });
  TestBed.inject(I18n).setLang(lang);
  const fixture = TestBed.createComponent(Landing);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim();

describe('Landing', () => {
  afterEach(() => {
    document.title = '';
    document.documentElement.lang = 'en';
    document.head
      .querySelectorAll('link[data-kora-seo], meta[name="description"]')
      .forEach((el) => el.remove());
  });

  it.each(LANGS)('has a single headline, with the hero text, in %s', (lang) => {
    const el = setup(lang);
    const { hero } = DICTIONARIES[lang].landing;
    expect(el.querySelectorAll('h1')).toHaveLength(1);
    expect(text(el.querySelector('h1'))).toBe(hero.title);
    expect(el.textContent).toContain(hero.subtitle);
  });

  it.each(LANGS)('offers the quick match as a link to the tool in %s', (lang) => {
    const el = setup(lang);
    const link = el.querySelector('a[href$="/amistoso"]') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe(`/${lang}/amistoso`);
    expect(text(link)).toBe(DICTIONARIES[lang].landing.hero.cta);
  });

  it.each(LANGS)('shows the three benefits, in order, in %s', (lang) => {
    const el = setup(lang);
    const { benefits } = DICTIONARIES[lang].landing;
    const cards = Array.from(el.querySelectorAll('ui-card'));
    expect(cards).toHaveLength(3);
    const expected = [benefits.noAccount, benefits.anyList, benefits.fairDraw];
    cards.forEach((card, i) => {
      expect(text(card.querySelector('h3'))).toBe(expected[i].title);
      expect(card.textContent).toContain(expected[i].text);
    });
  });

  it.each(LANGS)('names the benefits section for screen readers in %s', (lang) => {
    const el = setup(lang);
    const heading = el.querySelector('h2.sr-only');
    expect(text(heading)).toBe(DICTIONARIES[lang].landing.benefits.title);
  });

  it.each(LANGS)('shows the three steps, numbered and in order, in %s', (lang) => {
    const el = setup(lang);
    const { steps } = DICTIONARIES[lang].landing;
    expect(text(el.querySelector('h2:not(.sr-only)'))).toBe(steps.title);
    const items = Array.from(el.querySelectorAll('ol > li'));
    expect(items).toHaveLength(3);
    [steps.paste, steps.check, steps.draw].forEach((step, i) => {
      expect(text(items[i].querySelector('span')), `step ${i + 1} number`).toBe(String(i + 1));
      expect(text(items[i].querySelector('h3')), `step ${i + 1} title`).toBe(step.title);
      expect(text(items[i].querySelector('p')), `step ${i + 1} text`).toBe(step.text);
    });
  });

  it.each(LANGS)('sets the page title and description in %s', (lang) => {
    setup(lang);
    expect(document.title).toBe(DICTIONARIES[lang].meta.landing.title);
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      DICTIONARIES[lang].meta.landing.description,
    );
  });

  it('writes the canonical and alternate links once SITE_URL is set', () => {
    setup('es', 'https://kora.test');
    const canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    expect(canonical.href).toBe('https://kora.test/es');
    expect(document.head.querySelectorAll('link[rel="alternate"]')).toHaveLength(4);
  });

  it('writes no canonical or alternate links while SITE_URL is empty', () => {
    setup('es');
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('link[rel="alternate"]')).toBeNull();
  });
});
