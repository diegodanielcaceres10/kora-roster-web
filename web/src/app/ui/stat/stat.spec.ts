import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type StatTone, UiStat } from './stat';

@Component({
  imports: [UiStat],
  template: `
    <ui-stat
      label="Por equipo"
      [value]="value()"
      [note]="note()"
      [valueTone]="valueTone()"
      [noteTone]="noteTone()"
    />
  `,
})
class Host {
  readonly value = signal('5 vs 5');
  readonly note = signal('Parejos');
  readonly valueTone = signal<StatTone>('default');
  readonly noteTone = signal<'muted' | 'warning'>('muted');
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const update = (fn: (h: Host) => void) => {
    fn(fixture.componentInstance);
    fixture.detectChanges();
  };
  const part = (name: string) => el.querySelector(`[data-${name}]`) as HTMLElement | null;
  return { el, update, part };
}

describe('UiStat', () => {
  it('shows the label, the figure and the note', () => {
    const { part } = setup();
    expect(part('label')?.textContent?.trim()).toBe('Por equipo');
    expect(part('value')?.textContent?.trim()).toBe('5 vs 5');
    expect(part('note')?.textContent?.trim()).toBe('Parejos');
  });

  it('follows the figure and the note', () => {
    const { part, update } = setup();
    update((h) => {
      h.value.set('5 vs 6');
      h.note.set('Desparejos');
    });
    expect(part('value')?.textContent?.trim()).toBe('5 vs 6');
    expect(part('note')?.textContent?.trim()).toBe('Desparejos');
  });

  it('leaves the note out when there is none', () => {
    const { part, update } = setup();
    update((h) => h.note.set(''));
    expect(part('note')).toBeNull();
  });

  it('reads as one piece: the label first, then the figure and the note', () => {
    const { el } = setup();
    expect(el.textContent?.replace(/\s+/g, ' ').trim()).toBe('Por equipo 5 vs 5 Parejos');
  });

  it('can highlight the figure, and warn in the note', () => {
    const { part, update } = setup();
    const plain = part('value')?.className;
    const calm = part('note')?.className;
    update((h) => {
      h.valueTone.set('primary');
      h.noteTone.set('warning');
    });
    expect(part('value')?.className).not.toBe(plain);
    expect(part('note')?.className).not.toBe(calm);
  });
});
