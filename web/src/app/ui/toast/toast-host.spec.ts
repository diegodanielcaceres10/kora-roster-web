import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast-service';
import { UiToastHost } from './toast-host';

describe('UiToastHost', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const fixture = TestBed.createComponent(UiToastHost);
    fixture.detectChanges();
    const region = () => fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    return { fixture, region, toast: TestBed.inject(ToastService) };
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

  it('shows the newest message when two arrive in a row', () => {
    const { fixture, region, toast } = setup();
    toast.show('Copiado');
    toast.show('Sorteado');
    fixture.detectChanges();
    expect(region().textContent).toContain('Sorteado');
    expect(region().textContent).not.toContain('Copiado');
  });
});
