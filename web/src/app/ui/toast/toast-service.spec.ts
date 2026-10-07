import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast-service';

describe('ToastService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const create = () => TestBed.inject(ToastService);

  it('starts without a message', () => {
    expect(create().message()).toBeNull();
  });

  it('exposes the text it was asked to show', () => {
    const toast = create();
    toast.show('Copiado');
    expect(toast.message()).toBe('Copiado');
  });

  it('hides the message after 2500 ms by default, not before', () => {
    const toast = create();
    toast.show('Copiado');
    vi.advanceTimersByTime(2499);
    expect(toast.message()).toBe('Copiado');
    vi.advanceTimersByTime(1);
    expect(toast.message()).toBeNull();
  });

  it('honors a custom duration', () => {
    const toast = create();
    toast.show('Listo', 500);
    vi.advanceTimersByTime(499);
    expect(toast.message()).toBe('Listo');
    vi.advanceTimersByTime(1);
    expect(toast.message()).toBeNull();
  });

  it('replaces the current message and restarts the clock', () => {
    const toast = create();
    toast.show('A', 1000);
    vi.advanceTimersByTime(600);
    toast.show('B', 1000);
    vi.advanceTimersByTime(600);
    expect(toast.message()).toBe('B');
    vi.advanceTimersByTime(400);
    expect(toast.message()).toBeNull();
  });

  it('dismiss hides at once and cancels the pending timer', () => {
    const toast = create();
    toast.show('A', 1000);
    toast.dismiss();
    expect(toast.message()).toBeNull();
    toast.show('B', 5000);
    vi.advanceTimersByTime(1000);
    expect(toast.message()).toBe('B');
  });
});
