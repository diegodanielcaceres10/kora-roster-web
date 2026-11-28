import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RedirectToLanguage } from './redirect-to-language';

function setBrowserLanguages(languages: string[]) {
  Object.defineProperty(navigator, 'languages', { value: languages, configurable: true });
}

async function setup(languages: string[]) {
  setBrowserLanguages(languages);
  const router = { navigateByUrl: vi.fn() };
  TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: router }] });
  const fixture = TestBed.createComponent(RedirectToLanguage);
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, router };
}

describe('RedirectToLanguage', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'languages');
  });

  it('sends the visitor to the first supported browser language, replacing the history entry', async () => {
    const { router } = await setup(['fr', 'pt-BR', 'es']);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/pt', { replaceUrl: true });
  });

  it('falls back to English when no browser language is supported', async () => {
    const { router } = await setup(['fr', 'de']);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/en', { replaceUrl: true });
  });

  it('redirects only once', async () => {
    const { router } = await setup(['es']);
    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
  });

  it('offers a link to every language for visitors without JavaScript', async () => {
    const { fixture } = await setup(['en']);
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('noscript a'),
    ) as HTMLAnchorElement[];
    expect(links.map((a) => [a.getAttribute('href'), a.textContent?.trim()])).toEqual([
      ['/en', 'English'],
      ['/es', 'Español'],
      ['/pt', 'Português'],
    ]);
  });
});
