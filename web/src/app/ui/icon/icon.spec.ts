import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { UiIcon } from './icon';
import { ICON_NAMES, type IconName } from './icons';

@Component({
  imports: [UiIcon],
  template: `<ui-icon [name]="name()" />`,
})
class Host {
  readonly name = signal<IconName>('lock');
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const root = () => fixture.nativeElement.querySelector('ui-icon') as HTMLElement;
  const svg = () => root().querySelector('svg') as SVGSVGElement;
  const update = (fn: (h: Host) => void) => {
    fn(host);
    fixture.detectChanges();
  };
  return { root, svg, update };
}

describe('UiIcon', () => {
  it('draws the named icon as an inline svg', () => {
    const { root, svg } = setup();
    expect(svg()).not.toBeNull();
    expect(svg().querySelectorAll('path').length).toBeGreaterThan(0);
    expect(root().getAttribute('data-icon')).toBe('lock');
  });

  it('is decorative: hidden from assistive technology and not focusable', () => {
    const { svg } = setup();
    expect(svg().getAttribute('aria-hidden')).toBe('true');
    expect(svg().getAttribute('focusable')).toBe('false');
  });

  it('takes the size and the color of the text around it', () => {
    const { svg } = setup();
    expect(svg().getAttribute('width')).toBe('1em');
    expect(svg().getAttribute('height')).toBe('1em');
    expect(svg().getAttribute('stroke')).toBe('currentColor');
    expect(svg().getAttribute('fill')).toBe('none');
  });

  it('draws another icon when the name changes', () => {
    const { root, svg, update } = setup();
    const before = svg().innerHTML;
    update((h) => h.name.set('arrow-right'));
    expect(root().getAttribute('data-icon')).toBe('arrow-right');
    expect(svg().innerHTML).not.toBe(before);
  });
});

describe('icon registry', () => {
  it('has drawing data for every name', () => {
    expect(ICON_NAMES.length).toBeGreaterThan(0);
    for (const name of ICON_NAMES) {
      const host = TestBed.createComponent(Host);
      host.componentInstance.name.set(name);
      host.detectChanges();
      const svg = host.nativeElement.querySelector('svg') as SVGSVGElement;
      expect(svg.children.length, name).toBeGreaterThan(0);
    }
  });

  it('lists the names alphabetically with no duplicates', () => {
    expect([...ICON_NAMES]).toEqual([...new Set(ICON_NAMES)].sort());
  });

  it('is documented in the UI catalog', () => {
    const readme = readFileSync('src/app/ui/README.md', 'utf8');
    const missing = ICON_NAMES.filter((name) => !readme.includes(`\`${name}\``));
    expect(missing).toEqual([]);
  });
});
