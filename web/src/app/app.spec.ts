import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { THEME_STORAGE_KEY } from './theme/theme';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    localStorage.clear();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should host the routed page and the toast region', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
    expect(compiled.querySelector('ui-toast-host [role="status"]')).not.toBeNull();
  });

  it('applies the saved theme to the page as soon as it starts', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    TestBed.createComponent(App);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
