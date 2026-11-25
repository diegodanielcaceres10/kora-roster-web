import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { UiInput } from './input';

@Component({
  imports: [UiInput],
  template: `
    <ui-input
      label="Encabezado"
      [labelHidden]="labelHidden()"
      [type]="type()"
      [maxLength]="maxLength()"
      [showCount]="showCount()"
      [placeholder]="placeholder()"
      [hint]="hint()"
      [(value)]="text"
    />
  `,
})
class Host {
  readonly text = signal('');
  readonly labelHidden = signal(false);
  readonly type = signal<'text' | 'color'>('text');
  readonly maxLength = signal<number | undefined>(undefined);
  readonly showCount = signal(false);
  readonly placeholder = signal('');
  readonly hint = signal('');
}

@Component({
  imports: [UiInput],
  template: `
    <ui-input label="Primero" />
    <ui-input label="Segundo" />
  `,
})
class TwoHost {}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const el = fixture.nativeElement as HTMLElement;
  const field = () => el.querySelector('input') as HTMLInputElement;
  const label = () => el.querySelector('label') as HTMLLabelElement;
  const update = (fn: (h: Host) => void) => {
    fn(host);
    fixture.detectChanges();
  };
  return { fixture, el, host, field, label, update };
}

describe('UiInput', () => {
  it('links the label to the field', () => {
    const { field, label } = setup();
    expect(label().textContent).toContain('Encabezado');
    expect(label().control).toBe(field());
  });

  it('gives every instance its own id so each label points at its own field', () => {
    const fixture = TestBed.createComponent(TwoHost);
    fixture.detectChanges();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('label'),
    ) as HTMLLabelElement[];
    const fields = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
    ) as HTMLInputElement[];
    expect(labels[0].control).toBe(fields[0]);
    expect(labels[1].control).toBe(fields[1]);
  });

  it('shows the label, and hides it from the eyes but not from screen readers when asked', () => {
    const { label, field, update } = setup();
    expect(label().classList.contains('sr-only')).toBe(false);
    update((h) => h.labelHidden.set(true));
    expect(label().classList.contains('sr-only')).toBe(true);
    expect(label().control).toBe(field());
  });

  it('writes what the person types back to the bound value', () => {
    const { host, field } = setup();
    field().value = 'Amistoso jueves';
    field().dispatchEvent(new Event('input'));
    expect(host.text()).toBe('Amistoso jueves');
  });

  it('shows the value set from the outside', () => {
    const { field, update } = setup();
    update((h) => h.text.set('Hola'));
    expect(field().value).toBe('Hola');
  });

  it('is a text field unless asked for a color', () => {
    const { field, update } = setup();
    expect(field().type).toBe('text');
    update((h) => {
      h.type.set('color');
      h.text.set('#e53935');
    });
    expect(field().type).toBe('color');
    expect(field().value).toBe('#e53935');
  });

  it('limits the length only when a maximum is given', () => {
    const { field, update } = setup();
    expect(field().hasAttribute('maxlength')).toBe(false);
    update((h) => h.maxLength.set(200));
    expect(field().maxLength).toBe(200);
  });

  it('passes the placeholder to the field', () => {
    const { field, update } = setup();
    update((h) => h.placeholder.set('Ej.: Amistoso'));
    expect(field().placeholder).toBe('Ej.: Amistoso');
  });

  it('describes the field with the hint only when there is one', () => {
    const { el, field, update } = setup();
    expect(field().hasAttribute('aria-describedby')).toBe(false);
    update((h) => h.hint.set('Hasta 200 caracteres'));
    const hintId = field().getAttribute('aria-describedby') as string;
    expect(el.querySelector(`#${hintId}`)?.textContent).toContain('Hasta 200 caracteres');
  });

  it('can be focused and selected from outside, as the name editor needs', () => {
    const { fixture, field, update } = setup();
    const name = 'Jugador A';
    update((h) => h.text.set(name));
    const input = fixture.debugElement.query(By.directive(UiInput)).componentInstance as UiInput;
    input.focus();
    expect(document.activeElement).toBe(field());
    input.select();
    expect(field().selectionStart).toBe(0);
    expect(field().selectionEnd).toBe(name.length);
  });

  describe('the count of characters', () => {
    const count = (el: HTMLElement) => el.querySelector('[data-count]')?.textContent?.trim();

    it('is not shown by default, even with a limit', () => {
      const { el, update } = setup();
      update((h) => h.maxLength.set(200));
      expect(count(el)).toBeUndefined();
    });

    it('shows how many characters are used out of the limit, and follows what is typed', () => {
      const { el, update } = setup();
      update((h) => {
        h.maxLength.set(200);
        h.showCount.set(true);
        h.text.set('Amistoso');
      });
      expect(count(el)).toBe('8/200');
      update((h) => h.text.set('Amistoso del jueves'));
      expect(count(el)).toBe('19/200');
    });

    it('needs a limit to count against', () => {
      const { el, update } = setup();
      update((h) => h.showCount.set(true));
      expect(count(el)).toBeUndefined();
    });

    it('is kept apart from the label for assistive technology, which already knows the limit', () => {
      const { el, update } = setup();
      update((h) => {
        h.maxLength.set(200);
        h.showCount.set(true);
      });
      expect(el.querySelector('[data-count]')?.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
