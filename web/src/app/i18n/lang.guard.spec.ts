import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { I18n } from './i18n';
import { langGuard } from './lang.guard';

function run(data: Record<string, unknown>) {
  return TestBed.runInInjectionContext(() =>
    langGuard({ data } as unknown as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
}

describe('langGuard', () => {
  afterEach(() => {
    document.documentElement.lang = 'en';
  });

  it('sets the language of the route and lets the navigation continue', () => {
    expect(run({ lang: 'pt' })).toBe(true);
    expect(TestBed.inject(I18n).lang()).toBe('pt');
  });

  it.each([[{ lang: 'fr' }], [{ lang: 42 }], [{}]])(
    'refuses a route with data %j and keeps the current language',
    (data) => {
      expect(run(data)).toBe(false);
      expect(TestBed.inject(I18n).lang()).toBe('en');
    },
  );
});
