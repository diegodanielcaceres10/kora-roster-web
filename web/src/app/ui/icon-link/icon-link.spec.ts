import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UiIcon } from '../icon/icon';
import { ICON_BUTTON_BASE } from '../icon-button/icon-button-styles';
import { UiIconLink } from './icon-link';

@Component({
  imports: [UiIconLink, UiIcon],
  template: `
    <ui-icon-link [link]="['/es', 'account']" [label]="label()" [variant]="variant()">
      <ui-icon name="user" />
    </ui-icon-link>
  `,
})
class Host {
  readonly label = signal('Iniciar sesión');
  readonly variant = signal<'default' | 'primary'>('default');
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

describe('UiIconLink', () => {
  it('is a real link to the address it is given', () => {
    const { link } = setup();
    expect(link().tagName).toBe('A');
    expect(link().getAttribute('href')).toBe('/es/account');
  });

  it('exposes the label as the accessible name and follows changes', () => {
    const { link, update } = setup();
    expect(link().getAttribute('aria-label')).toBe('Iniciar sesión');
    update((h) => h.label.set('Mi cuenta'));
    expect(link().getAttribute('aria-label')).toBe('Mi cuenta');
  });

  it('projects the icon', () => {
    const { link } = setup();
    expect(link().querySelector('ui-icon[data-icon="user"]')).not.toBeNull();
  });

  it('looks like a UiIconButton', () => {
    const { link } = setup();
    for (const word of ICON_BUTTON_BASE.split(' ').slice(0, 4)) {
      expect(link().classList.contains(word)).toBe(true);
    }
  });

  it('looks different for the primary variant', () => {
    const { link, update } = setup();
    const normal = link().className;
    update((h) => h.variant.set('primary'));
    expect(link().className).not.toBe(normal);
  });
});
