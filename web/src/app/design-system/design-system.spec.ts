import { TestBed } from '@angular/core/testing';
import { ToastService } from '../ui';
import { DesignSystem } from './design-system';

function setup() {
  const fixture = TestBed.createComponent(DesignSystem);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('DesignSystem page', () => {
  afterEach(() => TestBed.inject(ToastService).dismiss());

  it('shows every component of the catalog', () => {
    const { el } = setup();
    for (const tag of [
      'ui-button',
      'ui-icon-button',
      'ui-textarea',
      'ui-card',
      'ui-badge',
      'ui-list-row',
      'ui-segmented',
    ]) {
      expect(el.querySelector(tag), tag).not.toBeNull();
    }
  });

  it('shows the three palette colors with their hex values', () => {
    const { el } = setup();
    for (const hex of ['#ffb627', '#1b2a41', '#0b8457']) {
      expect(el.textContent?.toLowerCase(), hex).toContain(hex);
    }
  });

  it('lets the goalkeeper demo button toggle on and off', () => {
    const { fixture, el } = setup();
    const button = el.querySelector('[data-demo="goalkeeper"] button') as HTMLButtonElement;
    expect(button.getAttribute('aria-pressed')).toBe('false');
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('fires the copied notice from the toast demo button', () => {
    const { el } = setup();
    (el.querySelector('[data-demo="toast"] button') as HTMLButtonElement).click();
    expect(TestBed.inject(ToastService).message()).toBe('Copiado');
  });
});
