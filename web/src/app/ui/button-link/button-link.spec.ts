import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { type ButtonSize, type ButtonVariant } from '../button/button';
import { BUTTON_BASE } from '../button/button-styles';
import { UiIcon } from '../icon/icon';
import { UiButtonLink } from './button-link';

@Component({
  imports: [UiButtonLink, UiIcon],
  template: `
    <ui-button-link [link]="['/es', 'friendly']" [variant]="variant()" [size]="size()">
      <ui-icon name="bolt" />
      Amistoso rápido
    </ui-button-link>
  `,
})
class Host {
  readonly variant = signal<ButtonVariant>('primary');
  readonly size = signal<ButtonSize>('md');
}

function setup() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const link = () => fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
  const update = (fn: (h: Host) => void) => {
    fn(fixture.componentInstance);
    fixture.detectChanges();
  };
  return { link, update };
}

describe('UiButtonLink', () => {
  it('is a real link to the address it is given', () => {
    const { link } = setup();
    expect(link().tagName).toBe('A');
    expect(link().getAttribute('href')).toBe('/es/friendly');
  });

  it('shows what is put inside it', () => {
    const { link } = setup();
    expect(link().textContent?.trim()).toBe('Amistoso rápido');
    expect(link().querySelector('ui-icon[data-icon="bolt"]')).not.toBeNull();
  });

  it('looks like a UiButton', () => {
    const { link } = setup();
    for (const word of BUTTON_BASE.split(' ').slice(0, 6)) {
      expect(link().classList.contains(word), word).toBe(true);
    }
  });

  it('looks different for each variant and each size', () => {
    const { link, update } = setup();
    const variants = new Set<string>();
    for (const variant of ['primary', 'secondary', 'outline', 'ghost'] as const) {
      update((h) => h.variant.set(variant));
      variants.add(link().className);
    }
    expect(variants.size).toBe(4);
    update((h) => h.variant.set('primary'));
    const sizes = new Set<string>();
    for (const size of ['sm', 'md', 'lg'] as const) {
      update((h) => h.size.set(size));
      sizes.add(link().className);
    }
    expect(sizes.size).toBe(3);
  });
});
