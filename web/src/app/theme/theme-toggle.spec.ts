import { TestBed } from '@angular/core/testing';
import { DICTIONARIES } from '../i18n/dictionaries';
import { I18n } from '../i18n/i18n';
import { Theme } from './theme';
import { ThemeToggle } from './theme-toggle';

function setup(lang: 'en' | 'es' | 'pt', saved?: 'light' | 'dark') {
  if (saved) localStorage.setItem('kora:theme', saved);
  TestBed.inject(I18n).setLang(lang);
  const fixture = TestBed.createComponent(ThemeToggle);
  fixture.detectChanges();
  const button = () => fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const icon = () => fixture.nativeElement.querySelector('ui-icon')?.getAttribute('data-icon');
  const click = () => {
    button().click();
    fixture.detectChanges();
  };
  return { button, icon, click, theme: TestBed.inject(Theme) };
}

describe('ThemeToggle', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.lang = 'en';
  });

  it.each(['en', 'es', 'pt'] as const)(
    'offers dark mode with a moon while the page is light, in %s',
    (lang) => {
      const { button, icon } = setup(lang);
      expect(button().getAttribute('aria-label')).toBe(DICTIONARIES[lang].theme.toDark);
      expect(icon()).toBe('moon');
    },
  );

  it.each(['en', 'es', 'pt'] as const)(
    'offers light mode with a sun while the page is dark, in %s',
    (lang) => {
      const { button, icon } = setup(lang, 'dark');
      expect(button().getAttribute('aria-label')).toBe(DICTIONARIES[lang].theme.toLight);
      expect(icon()).toBe('sun');
    },
  );

  it('switches the mode of the page when it is pressed, and back', () => {
    const { click, icon, theme } = setup('en');
    click();
    expect(theme.mode()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(icon()).toBe('sun');
    click();
    expect(theme.mode()).toBe('light');
    expect(icon()).toBe('moon');
  });
});
