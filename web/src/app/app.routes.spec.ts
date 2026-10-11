import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { DICTIONARIES } from './i18n/dictionaries';
import { I18n } from './i18n/i18n';
import { AmistosoStore } from './state/amistoso.store';

async function open(url: string) {
  TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url);
  const root = harness.fixture.nativeElement as HTMLElement;
  return { harness, root, router: TestBed.inject(Router), i18n: TestBed.inject(I18n) };
}

const heading = (root: HTMLElement) => root.querySelector('h1')?.textContent;

describe('app routes', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'languages');
    document.documentElement.lang = 'en';
    document.title = '';
  });

  it.each(['en', 'es', 'pt'] as const)('shows the landing in its language at /%s', async (lang) => {
    const { root, i18n } = await open(`/${lang}`);
    expect(i18n.lang()).toBe(lang);
    expect(heading(root)).toContain(DICTIONARIES[lang].meta.landing.title);
    expect(document.documentElement.lang).toBe(lang);
  });

  it.each(['en', 'es', 'pt'] as const)(
    'shows the tool in its language at /%s/amistoso',
    async (lang) => {
      const { root, i18n } = await open(`/${lang}/amistoso`);
      expect(i18n.lang()).toBe(lang);
      expect(heading(root)).toContain(DICTIONARIES[lang].tool.heading);
    },
  );

  it('wraps both pages in the shared header with the language selector', async () => {
    const { root } = await open('/es/amistoso');
    expect(root.querySelector('header app-language-selector')).not.toBeNull();
    expect(root.querySelector('footer')).not.toBeNull();
  });

  it('keeps /design-system outside the languages and without the shared header', async () => {
    const { root, i18n } = await open('/design-system');
    expect(heading(root)).toContain('Design system');
    expect(i18n.lang()).toBe('en');
    expect(root.querySelector('app-language-selector')).toBeNull();
  });

  it('sends "/" to the first supported browser language', async () => {
    Object.defineProperty(navigator, 'languages', { value: ['fr', 'es-AR'], configurable: true });
    const { harness, router } = await open('/');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/es');
  });

  it('sends "/" to English when the browser language is not supported', async () => {
    Object.defineProperty(navigator, 'languages', { value: ['fr'], configurable: true });
    const { harness, router } = await open('/');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/en');
  });

  it('sends an unknown address through the same language choice', async () => {
    Object.defineProperty(navigator, 'languages', { value: ['pt-BR'], configurable: true });
    const { harness, router } = await open('/no-such-page');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/pt');
  });

  it('changes language from the header and lands on the same page in the new language', async () => {
    const { harness, root, router } = await open('/es/amistoso');
    const portuguese = Array.from(root.querySelectorAll('[role="radio"]')).find(
      (r) => r.textContent?.trim() === 'PT',
    ) as HTMLButtonElement;
    portuguese.click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/pt/amistoso');
    expect(heading(root)).toContain(DICTIONARIES.pt.tool.heading);
  });

  it('keeps the pasted list when the language changes', async () => {
    const { harness, root, router } = await open('/es/amistoso');
    const store = TestBed.inject(AmistosoStore);
    const field = root.querySelector('textarea') as HTMLTextAreaElement;
    field.value = Array.from({ length: 12 }, (_, i) => `Player ${i + 1}`).join('\n');
    field.dispatchEvent(new Event('input'));
    harness.fixture.detectChanges();
    (root.querySelector('ui-button button') as HTMLButtonElement).click();
    harness.fixture.detectChanges();
    expect(root.textContent).toContain(DICTIONARIES.es.tool.preview.count(12));

    const portuguese = Array.from(root.querySelectorAll('[role="radio"]')).find(
      (r) => r.textContent?.trim() === 'PT',
    ) as HTMLButtonElement;
    portuguese.click();
    await harness.fixture.whenStable();

    expect(router.url).toBe('/pt/amistoso');
    expect(store.players()).toHaveLength(12);
    expect(root.textContent).toContain(DICTIONARIES.pt.tool.preview.count(12));
  });
});
