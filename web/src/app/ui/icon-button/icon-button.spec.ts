import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiIconButton } from './icon-button';

@Component({
  imports: [UiIconButton],
  template: `
    <ui-icon-button
      [label]="label()"
      [variant]="variant()"
      [pressed]="pressed()"
      [disabled]="disabled()"
      (click)="clicks.set(clicks() + 1)"
    >
      <i class="fa-solid fa-mitten" aria-hidden="true"></i>
    </ui-icon-button>
  `,
})
class Host {
  readonly label = signal('Marcar como arquero');
  readonly variant = signal<'default' | 'danger'>('default');
  readonly pressed = signal<boolean | undefined>(undefined);
  readonly disabled = signal(false);
  readonly clicks = signal(0);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const button = () => fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const update = (fn: (h: Host) => void) => {
    fn(host);
    fixture.detectChanges();
  };
  return { host, button, update };
}

describe('UiIconButton', () => {
  it('exposes the label as the accessible name and follows changes', () => {
    const { button, update } = setup();
    expect(button().getAttribute('aria-label')).toBe('Marcar como arquero');
    update((h) => h.label.set('Quitar arquero'));
    expect(button().getAttribute('aria-label')).toBe('Quitar arquero');
  });

  it('projects the icon into the native button', () => {
    const { button } = setup();
    expect(button().querySelector('i.fa-mitten')).not.toBeNull();
  });

  it('is not announced as a toggle unless pressed is defined', () => {
    const { button, update } = setup();
    expect(button().hasAttribute('aria-pressed')).toBe(false);
    update((h) => h.pressed.set(false));
    expect(button().getAttribute('aria-pressed')).toBe('false');
    update((h) => h.pressed.set(true));
    expect(button().getAttribute('aria-pressed')).toBe('true');
  });

  it('looks different when pressed', () => {
    const { button, update } = setup();
    update((h) => h.pressed.set(false));
    const off = button().className;
    update((h) => h.pressed.set(true));
    expect(button().className).not.toBe(off);
  });

  it('looks different for the danger variant', () => {
    const { button, update } = setup();
    const normal = button().className;
    update((h) => h.variant.set('danger'));
    expect(button().className).not.toBe(normal);
  });

  it('never submits a form', () => {
    const { button } = setup();
    expect(button().type).toBe('button');
  });

  it('bubbles clicks to the host element', () => {
    const { button, host } = setup();
    button().click();
    expect(host.clicks()).toBe(1);
  });

  it('swallows clicks when disabled', () => {
    const { button, host, update } = setup();
    update((h) => h.disabled.set(true));
    button().click();
    expect(button().disabled).toBe(true);
    expect(host.clicks()).toBe(0);
  });
});
