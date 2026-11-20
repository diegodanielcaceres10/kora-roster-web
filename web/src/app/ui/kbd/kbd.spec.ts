import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiKbd } from './kbd';

@Component({ imports: [UiKbd], template: `<p>Pulsa <ui-kbd>Esc</ui-kbd> para cancelar</p>` })
class Host {}

describe('UiKbd', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('is a real keyboard key, so assistive technology reads it as one', () => {
    const el = setup();
    const key = el.querySelector('ui-kbd kbd') as HTMLElement;
    expect(key.tagName).toBe('KBD');
    expect(key.textContent?.trim()).toBe('Esc');
  });

  it('stays in the line of text around it', () => {
    const el = setup();
    expect(el.querySelector('p')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Pulsa Esc para cancelar',
    );
    expect((el.querySelector('ui-kbd') as HTMLElement).classList.contains('inline-flex')).toBe(true);
  });
});
