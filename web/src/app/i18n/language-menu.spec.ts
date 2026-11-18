import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { I18n } from './i18n';
import { LanguageMenu } from './language-menu';

function setup(lang: 'en' | 'es' | 'pt', url = '/es/friendly') {
  const router = { url, navigateByUrl: vi.fn() };
  TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: router }] });
  TestBed.inject(I18n).setLang(lang);
  const fixture = TestBed.createComponent(LanguageMenu);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const trigger = () => el.querySelector('ui-icon-button button') as HTMLButtonElement;
  const options = () => Array.from(el.querySelectorAll('ul button')) as HTMLButtonElement[];
  const settle = () => fixture.detectChanges();
  const open = () => {
    trigger().click();
    settle();
  };
  const pick = (name: string) => {
    options()
      .find((option) => option.textContent?.trim() === name)
      ?.click();
    settle();
  };
  return { el, router, trigger, options, open, pick, settle };
}

describe('LanguageMenu', () => {
  afterEach(() => {
    document.documentElement.lang = 'en';
  });

  describe('closed', () => {
    it.each([
      ['en', 'Language'],
      ['es', 'Idioma'],
      ['pt', 'Idioma'],
    ] as const)('is a globe button named in the current language (%s)', (lang, name) => {
      const { el, trigger } = setup(lang);
      expect(trigger().getAttribute('aria-label')).toBe(name);
      expect(trigger().getAttribute('aria-expanded')).toBe('false');
      expect(el.querySelector('ui-icon[data-icon="world"]')).not.toBeNull();
    });

    it('does not show the languages yet', () => {
      const { options } = setup('es');
      expect(options()).toHaveLength(0);
    });
  });

  describe('open', () => {
    it('lists the languages by their own names, each marked with its language', () => {
      const { open, options, trigger } = setup('es');
      open();
      expect(trigger().getAttribute('aria-expanded')).toBe('true');
      expect(options().map((o) => o.textContent?.trim())).toEqual([
        'English',
        'Español',
        'Português',
      ]);
      expect(options().map((o) => o.getAttribute('lang'))).toEqual(['en', 'es', 'pt']);
    });

    it('marks the current language', () => {
      const { open, options } = setup('pt');
      open();
      expect(options().map((o) => o.getAttribute('aria-current'))).toEqual([null, null, 'true']);
    });

    it('closes when the button is pressed again', () => {
      const { open, trigger, options } = setup('es');
      open();
      open();
      expect(trigger().getAttribute('aria-expanded')).toBe('false');
      expect(options()).toHaveLength(0);
    });
  });

  describe('choosing', () => {
    it('goes to the same place in the chosen language', () => {
      const { router, open, pick } = setup('es', '/es/friendly');
      open();
      pick('Português');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/pt/friendly');
    });

    it('keeps the query string', () => {
      const { router, open, pick } = setup('en', '/en?ref=wa');
      open();
      pick('Español');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/es?ref=wa');
    });

    it('does not navigate when the current language is chosen again, but closes', () => {
      const { router, open, pick, options } = setup('es');
      open();
      pick('Español');
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(options()).toHaveLength(0);
    });

    it('closes and gives the focus back to the button', () => {
      const { open, pick, options, trigger } = setup('es');
      open();
      pick('English');
      expect(options()).toHaveLength(0);
      expect(document.activeElement).toBe(trigger());
    });
  });

  describe('closing without choosing', () => {
    it('closes with Escape and gives the focus back to the button', () => {
      const { open, options, trigger, settle } = setup('es');
      open();
      options()[0].focus();
      options()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      settle();
      expect(options()).toHaveLength(0);
      expect(document.activeElement).toBe(trigger());
    });

    it('closes when something outside is clicked', () => {
      const { open, options, settle } = setup('es');
      open();
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      settle();
      expect(options()).toHaveLength(0);
    });

    it('closes when the focus moves to something outside', () => {
      const { open, options, settle } = setup('es');
      open();
      document.body.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      settle();
      expect(options()).toHaveLength(0);
    });

    it('stays open when the click is inside the menu', () => {
      const { open, options, el, settle } = setup('es');
      open();
      el.querySelector('ul')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      settle();
      expect(options()).toHaveLength(3);
    });
  });
});
