import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18n } from '../i18n/i18n';
import { Shell } from './shell';

function setup(lang: 'en' | 'es' | 'pt') {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  TestBed.inject(I18n).setLang(lang);
  const fixture = TestBed.createComponent(Shell);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('Shell', () => {
  afterEach(() => {
    document.documentElement.lang = 'en';
  });

  it.each(['en', 'es', 'pt'] as const)('links the logo to the landing in %s', (lang) => {
    const el = setup(lang);
    expect(el.querySelector('header a')?.getAttribute('href')).toBe(`/${lang}`);
  });

  it('shows the language selector in the header', () => {
    const el = setup('en');
    expect(el.querySelector('header app-language-selector')).not.toBeNull();
  });

  it('puts the routed page inside the main area', () => {
    const el = setup('en');
    expect(el.querySelector('main router-outlet')).not.toBeNull();
  });

  it('closes with a footer', () => {
    const el = setup('en');
    expect(el.querySelector('footer')?.textContent).toContain('Kora Roster');
  });
});
