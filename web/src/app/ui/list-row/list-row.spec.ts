import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiListRow } from './list-row';

@Component({
  imports: [UiListRow],
  template: `
    <ui-list-row [highlight]="highlight()">
      <span row-start>7</span>
      <span>Diego</span>
      <button row-end type="button">Quitar</button>
    </ui-list-row>
  `,
})
class Host {
  readonly highlight = signal(false);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const row = fixture.nativeElement.querySelector('ui-list-row') as HTMLElement;
  return { fixture, row };
}

describe('UiListRow', () => {
  it('places the start, content and end slots in that order', () => {
    const { row } = setup();
    const [start, content, end] = Array.from(row.children) as HTMLElement[];
    expect(start.textContent?.trim()).toBe('7');
    expect(content.textContent?.trim()).toBe('Diego');
    expect(end.querySelector('button')?.textContent).toContain('Quitar');
  });

  it('is exposed as a list item', () => {
    const { row } = setup();
    expect(row.getAttribute('role')).toBe('listitem');
  });

  it('looks different when highlighted', () => {
    const { fixture, row } = setup();
    const normal = row.className;
    fixture.componentInstance.highlight.set(true);
    fixture.detectChanges();
    expect(row.className).not.toBe(normal);
  });

  it('keeps the same look when highlight goes back to false', () => {
    const { fixture, row } = setup();
    const normal = row.className;
    fixture.componentInstance.highlight.set(true);
    fixture.detectChanges();
    fixture.componentInstance.highlight.set(false);
    fixture.detectChanges();
    expect(row.className).toBe(normal);
  });
});
