import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiLogo } from './logo';

@Component({ imports: [UiLogo], template: `<ui-logo />` })
class Host {}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const host = el.querySelector('ui-logo') as HTMLElement;
  return {
    host,
    mark: host.querySelector('img') as HTMLImageElement,
    name: host.querySelector('[data-name]') as HTMLElement,
    tag: host.querySelector('ui-badge') as HTMLElement,
  };
}

describe('UiLogo', () => {
  it('shows the mark, the name and the Roster tag, in this order', () => {
    const { host, mark, name, tag } = setup();
    expect(host.children).toHaveLength(3);
    expect(host.children[0]).toBe(mark);
    expect(host.children[1]).toBe(name);
    expect(host.children[2].contains(tag)).toBe(true);
  });

  it('reads as "Kora Roster" for assistive technology, with the mark left out as decoration', () => {
    const { host, mark } = setup();
    expect(mark.getAttribute('alt')).toBe('');
    expect(host.textContent?.replace(/\s+/g, ' ').trim()).toBe('Kora Roster');
  });

  it('draws the mark from the favicon, as a 32 px square', () => {
    const { mark } = setup();
    expect(mark.getAttribute('src')).toBe('favicon.png');
    expect([mark.getAttribute('width'), mark.getAttribute('height')]).toEqual(['32', '32']);
    expect(mark.classList.contains('size-8')).toBe(true);
  });

  it('writes the name in capitals with the display font, and the tag as a primary badge', () => {
    const { name, tag } = setup();
    expect(name.textContent?.trim()).toBe('Kora');
    expect(name.classList.contains('font-display')).toBe(true);
    expect(name.classList.contains('uppercase')).toBe(true);
    expect(tag.textContent?.trim()).toBe('Roster');
    expect(tag.querySelector('span')?.className).toContain('bg-primary/20');
  });

  describe('the alignment', () => {
    it('puts the three on one horizontal center line, not on a shared text baseline', () => {
      const { host } = setup();
      expect(host.classList.contains('inline-flex')).toBe(true);
      expect(host.classList.contains('items-center')).toBe(true);
      expect(host.classList.contains('items-baseline')).toBe(false);
    });

    it('keeps the line height of the page out of the row, so no part is pushed off the center', () => {
      const { host, name } = setup();
      expect(host.classList.contains('leading-none')).toBe(true);
      expect(name.classList.contains('leading-none')).toBe(true);
    });

    it('lets the tag sit in a box of its own, so the badge is not placed on a text baseline', () => {
      const { host, tag } = setup();
      const box = host.children[2] as HTMLElement;
      expect(box).not.toBe(tag);
      expect(box.classList.contains('flex')).toBe(true);
      expect(box.classList.contains('leading-none')).toBe(true);
    });
  });

  it('is only the logo: it has no link of its own, so each page decides where it goes', () => {
    const { host } = setup();
    expect(host.querySelector('a, button')).toBeNull();
  });
});
