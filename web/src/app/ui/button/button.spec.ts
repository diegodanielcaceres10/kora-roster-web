import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ButtonVariant, UiButton } from './button';

@Component({
  imports: [UiButton],
  template: `
    <ui-button
      [variant]="variant()"
      [type]="type()"
      [disabled]="disabled()"
      [ariaLabel]="ariaLabel()"
      (click)="clicks.set(clicks() + 1)"
    >
      <i class="fa-solid fa-shuffle"></i> Sortear
    </ui-button>
  `,
})
class Host {
  readonly variant = signal<ButtonVariant>('primary');
  readonly type = signal<'button' | 'submit'>('button');
  readonly disabled = signal(false);
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly clicks = signal(0);
}

@Component({ imports: [UiButton], template: `<ui-button>Default</ui-button>` })
class DefaultHost {}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const button = () => fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const update = (fn: (h: Host) => void) => {
    fn(host);
    fixture.detectChanges();
  };
  return { fixture, host, button, update };
}

describe('UiButton', () => {
  it('projects its content into the native button', () => {
    const { button } = setup();
    expect(button().textContent).toContain('Sortear');
    expect(button().querySelector('i.fa-shuffle')).not.toBeNull();
  });

  it('renders a different look for every variant', () => {
    const { button, update } = setup();
    const looks = new Set<string>();
    for (const variant of ['primary', 'secondary', 'outline', 'ghost'] as const) {
      update((h) => h.variant.set(variant));
      looks.add(button().className);
    }
    expect(looks.size).toBe(4);
  });

  it('uses the primary variant when none is given', () => {
    const explicit = setup();
    const fallback = TestBed.createComponent(DefaultHost);
    fallback.detectChanges();
    const fallbackButton = fallback.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(fallbackButton.className).toBe(explicit.button().className);
  });

  it('never submits a form unless type is submit', () => {
    const { button, update } = setup();
    expect(button().type).toBe('button');
    update((h) => h.type.set('submit'));
    expect(button().type).toBe('submit');
  });

  it('does not submit a form when no type is given', () => {
    const fallback = TestBed.createComponent(DefaultHost);
    fallback.detectChanges();
    const button = fallback.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.type).toBe('button');
  });

  it('bubbles clicks from the native button to the host element', () => {
    const { button, host } = setup();
    button().click();
    expect(host.clicks()).toBe(1);
  });

  it('swallows clicks and disables the native button when disabled', () => {
    const { button, host, update } = setup();
    update((h) => h.disabled.set(true));
    button().click();
    expect(button().disabled).toBe(true);
    expect(host.clicks()).toBe(0);
  });

  it('forwards ariaLabel only when provided', () => {
    const { button, update } = setup();
    expect(button().hasAttribute('aria-label')).toBe(false);
    update((h) => h.ariaLabel.set('Sortear equipos'));
    expect(button().getAttribute('aria-label')).toBe('Sortear equipos');
  });
});
