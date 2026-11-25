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

  describe('the hero', () => {
    it.each(LANGS)('has a single headline, with its accent, in %s', (lang) => {
      const el = setup(lang);
      const { hero } = DICTIONARIES[lang].landing;
      expect(el.querySelectorAll('h1')).toHaveLength(1);
      expect(text(el.querySelector('h1'))).toBe(`${hero.title} ${hero.accent}`);
      expect(text(el.querySelector('h1 span'))).toBe(hero.accent);
      expect(el.textContent).toContain(hero.subtitle);
    });

    it.each(LANGS)('offers the quick match as a link to the tool in %s', (lang) => {
      const el = setup(lang);
      const link = el.querySelector('a[href$="/friendly"]') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe(`/${lang}/friendly`);
      expect(text(link)).toBe(DICTIONARIES[lang].landing.hero.cta);
    });

    it.each(LANGS)('lists three promises under the buttons in %s', (lang) => {
      const el = setup(lang);
      const { checks } = DICTIONARIES[lang].landing.hero;
      const items = Array.from(el.querySelectorAll('[data-checks] li')).map((li) => text(li));
      expect(items).toEqual([...checks]);
    });

    it('scrolls to the demonstration when its button is pressed', () => {
      const scroll = vi.fn();
      Object.defineProperty(Element.prototype, 'scrollIntoView', {
        configurable: true,
        value: scroll,
      });
      const el = setup('es');
      const button = Array.from(el.querySelectorAll('button')).find((b) =>
        b.textContent?.includes(DICTIONARIES.es.landing.hero.demo),
      ) as HTMLButtonElement;
      button.click();
      expect(scroll).toHaveBeenCalledTimes(1);
      expect(scroll.mock.contexts[0]).toBe(el.querySelector('#demo'));
    });
  });

  describe('the demonstration', () => {
    const demo = (lang: Lang = 'es') => setup(lang).querySelector('#demo') as HTMLElement;
    const teams = (el: HTMLElement) => Array.from(el.querySelectorAll('[data-team]'));
    const names = (team: Element) =>
      Array.from(team.querySelectorAll('li')).map((li) => text(li.querySelector('[data-name]')));

    it.each(LANGS)('shows the list that is pasted and the labels of the draw in %s', (lang) => {
      const el = demo(lang);
      const { demo: d } = DICTIONARIES[lang].landing;
      for (const label of [d.input, d.clipboard, d.draw, d.result]) {
        expect(el.textContent).toContain(label);
      }
      expect(el.textContent).toContain('🧤');
      expect(el.textContent).toContain('(gk)');
    });

    it('is drawn with the real parser and draw, so it never shows what the app does not do', () => {
      const el = demo();
      const [a, b] = teams(el);
      expect(names(a)).toHaveLength(5);
      expect(names(b)).toHaveLength(5);
      for (const team of [a, b]) {
        expect(team.querySelectorAll('ui-icon[data-icon="glove"]')).toHaveLength(1);
      }
      const all = [...names(a), ...names(b)].sort();
      expect(new Set(all).size).toBe(10);
      expect(all).toContain(DICTIONARIES.es.tool.playerName(1));
      expect(all).toContain(DICTIONARIES.es.tool.playerName(5));
    });

    it.each(LANGS)(
      'uses numbered players in the language of the page, never real names in %s',
      (lang) => {
        const el = demo(lang);
        const { playerName } = DICTIONARIES[lang].tool;
        const pasted = Array.from(el.querySelectorAll('ol li')).map((li) => text(li));
        expect(pasted).toHaveLength(10);
        pasted.forEach((line, i) => expect(line).toContain(playerName(i + 1)));
        const shown = teams(el).flatMap(names);
        expect(shown.sort()).toEqual(
          Array.from({ length: 10 }, (_, i) => playerName(i + 1)).sort(),
        );
      },
    );

    it('names the teams like the tool does', () => {
      const el = demo();
      const titles = teams(el).map((team) => text(team.querySelector('h3')));
      expect(titles).toEqual([
        DICTIONARIES.es.tool.teamTitle(1),
        DICTIONARIES.es.tool.teamTitle(2),
      ]);
    });

    it.each(LANGS)('ends with a link to try it with their own list in %s', (lang) => {
      const el = demo(lang);
      const link = el.querySelector('a[href$="/friendly"]') as HTMLAnchorElement;
      expect(text(link)).toBe(DICTIONARIES[lang].landing.demo.cta);
    });
  });

  describe('how it works', () => {
    it.each(LANGS)('shows the title and the three steps, numbered and in order, in %s', (lang) => {
      const el = setup(lang);
      const { steps } = DICTIONARIES[lang].landing;
      expect(text(el.querySelector('[data-steps] [data-eyebrow]'))).toBe(steps.eyebrow);
      expect(text(el.querySelector('[data-steps] h2'))).toBe(steps.title);
      expect(el.textContent).toContain(steps.subtitle);
      const items = Array.from(el.querySelectorAll('[data-steps] ol > li'));
      expect(items).toHaveLength(3);
      [steps.paste, steps.balance, steps.send].forEach((step, i) => {
        expect(text(items[i].querySelector('[data-number]')), `step ${i + 1}`).toBe(`0${i + 1}`);
        expect(text(items[i].querySelector('h3')), `title ${i + 1}`).toBe(step.title);
        expect(text(items[i].querySelector('p')), `text ${i + 1}`).toBe(step.text);
      });
    });
  });

  describe('the call to action at the end', () => {
    it.each(LANGS)('invites to the next match with a link to the tool in %s', (lang) => {
      const el = setup(lang);
      const { cta, hero } = DICTIONARIES[lang].landing;
      const band = el.querySelector('[data-cta]') as HTMLElement;
      expect(text(band.querySelector('[data-tag]'))).toBe(cta.tag);
      expect(text(band.querySelector('h2'))).toBe(cta.title);
      expect(band.textContent).toContain(cta.text);
      expect(text(band.querySelector('a[href$="/friendly"]'))).toBe(hero.cta);
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
