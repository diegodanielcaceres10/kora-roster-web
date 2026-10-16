import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SelectOption, UiSelect } from './select';

const OPTIONS: SelectOption[] = [
  { value: '', label: 'Cualquiera' },
  { value: '5', label: '5' },
  { value: '7', label: '7' },
];

@Component({
  imports: [UiSelect],
  template: `<ui-select label="Jugadores por equipo" [options]="options" [(value)]="size" />`,
})
class Host {
  readonly options = OPTIONS;
  readonly size = signal('');
}

@Component({
  imports: [UiSelect],
  template: `
    <ui-select label="Primero" [options]="options" />
    <ui-select label="Segundo" [options]="options" />
  `,
})
class TwoHost {
  readonly options = OPTIONS;
}

function setup(initial = '') {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.size.set(initial);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const el = fixture.nativeElement as HTMLElement;
  const select = () => el.querySelector('select') as HTMLSelectElement;
  const choose = (value: string) => {
    select().value = value;
    select().dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };
  return { fixture, host, el, select, choose };
}

describe('UiSelect', () => {
  it('links the label to the list', () => {
    const { el, select } = setup();
    const label = el.querySelector('label') as HTMLLabelElement;
    expect(label.textContent).toContain('Jugadores por equipo');
    expect(label.control).toBe(select());
  });

  it('gives every instance its own id so each label points at its own list', () => {
    const fixture = TestBed.createComponent(TwoHost);
    fixture.detectChanges();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('label'),
    ) as HTMLLabelElement[];
    const lists = Array.from(
      fixture.nativeElement.querySelectorAll('select'),
    ) as HTMLSelectElement[];
    expect(labels[0].control).toBe(lists[0]);
    expect(labels[1].control).toBe(lists[1]);
  });

  it('offers the options in order, with their labels', () => {
    const { select } = setup();
    expect(Array.from(select().options).map((o) => [o.value, o.textContent?.trim()])).toEqual([
      ['', 'Cualquiera'],
      ['5', '5'],
      ['7', '7'],
    ]);
  });

  it('shows the option that matches the value', () => {
    const { select } = setup('7');
    expect(select().value).toBe('7');
  });

  it('follows a value that changes from the outside', () => {
    const { host, fixture, select } = setup('5');
    host.size.set('7');
    fixture.detectChanges();
    expect(select().value).toBe('7');
  });

  it('writes the chosen option back to the bound value', () => {
    const { host, choose } = setup();
    choose('5');
    expect(host.size()).toBe('5');
    choose('');
    expect(host.size()).toBe('');
  });
});
