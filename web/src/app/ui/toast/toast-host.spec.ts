import { TestBed } from '@angular/core/testing';
import { Toast } from './toast';
import { UiToastHost } from './toast-host';

describe('UiToastHost', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const fixture = TestBed.createComponent(UiToastHost);
    fixture.detectChanges();
    const region = () => fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    return { fixture, region, toast: TestBed.inject(Toast) };
  }

  it('keeps an empty status region in the page before any message', () => {
    const { region } = setup();
    expect(region()).not.toBeNull();
    expect(region().textContent?.trim()).toBe('');
  });

  it('shows the message inside the status region and clears it when it expires', () => {
    const { fixture, region, toast } = setup();
    toast.show('Copiado', 1000);
    fixture.detectChanges();
    expect(region().textContent).toContain('Copiado');
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(region()).not.toBeNull();
    expect(region().textContent?.trim()).toBe('');
  });

  describe('the colors of the message', () => {
    const bubble = () => {
      const { fixture, toast } = setup();
      toast.show('Copiado');
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('p') as HTMLElement;
    };

    // Tailwind cannot be measured in jsdom, so the classes that give each look are checked.
    it('stays dark in the dark theme: the surface of the app with its own text, not inverted', () => {
      const { classList } = bubble();
      expect(classList.contains('dark:bg-surface')).toBe(true);
      expect(classList.contains('dark:text-ink')).toBe(true);
    });

    it('keeps its edge visible in the dark theme', () => {
      expect(bubble().classList.contains('dark:border-ink/20')).toBe(true);
    });

    it('stays dark in the light theme too, so it stands out from the page', () => {
      const { classList } = bubble();
      expect(classList.contains('bg-ink/95')).toBe(true);
      expect(classList.contains('text-canvas')).toBe(true);
    });
  });

  it('shows the newest message when two arrive in a row', () => {
    const { fixture, region, toast } = setup();
    toast.show('Copiado');
    toast.show('Sorteado');
    fixture.detectChanges();
    expect(region().textContent).toContain('Sorteado');
    expect(region().textContent).not.toContain('Copiado');
  });
});
