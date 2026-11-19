import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiTextarea } from './textarea';

@Component({
  imports: [UiTextarea],
  template: `
    <ui-textarea
      label="Lista de WhatsApp"
      [placeholder]="placeholder()"
      [rows]="rows()"
      [hint]="hint()"
      [numbered]="numbered()"
      [hideLabel]="hideLabel()"
      [(value)]="text"
    />
  `,
})
class Host {
  readonly control = viewChild.required(UiTextarea);
  readonly numbered = signal(false);
  readonly hideLabel = signal(false);
  readonly text = signal('');
  readonly placeholder = signal('Pegá la lista acá');
  readonly rows = signal<number | undefined>(undefined);
  readonly hint = signal('');
}

@Component({
  imports: [UiTextarea],
  template: `
    <ui-textarea label="Primera" />
    <ui-textarea label="Segunda" />
  `,
})
class TwoHost {}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const el = fixture.nativeElement as HTMLElement;
  const field = () => el.querySelector('textarea') as HTMLTextAreaElement;
  const update = (fn: (h: Host) => void) => {
    fn(host);
    fixture.detectChanges();
  };
  return { el, host, field, update };
}

describe('UiTextarea', () => {
  it('links the label to the textarea', () => {
    const { el, field } = setup();
    const label = el.querySelector('label') as HTMLLabelElement;
    expect(label.textContent).toContain('Lista de WhatsApp');
    expect(label.control).toBe(field());
  });

  it('gives every instance its own id so each label points at its own field', () => {
    const fixture = TestBed.createComponent(TwoHost);
    fixture.detectChanges();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('label'),
    ) as HTMLLabelElement[];
    const fields = Array.from(
      fixture.nativeElement.querySelectorAll('textarea'),
    ) as HTMLTextAreaElement[];
    expect(labels[0].control).toBe(fields[0]);
    expect(labels[1].control).toBe(fields[1]);
  });

  it('writes what the user types back to the bound value', () => {
    const { host, field } = setup();
    field().value = '1. Diego 🧤';
    field().dispatchEvent(new Event('input'));
    expect(host.text()).toBe('1. Diego 🧤');
  });

  it('shows the value set from the outside', () => {
    const { field, update } = setup();
    update((h) => h.text.set('2. Mati'));
    expect(field().value).toBe('2. Mati');
  });

  it('uses 6 rows by default and honors a custom number', () => {
    const { field, update } = setup();
    expect(field().rows).toBe(6);
    update((h) => h.rows.set(3));
    expect(field().rows).toBe(3);
  });

  it('passes the placeholder to the textarea', () => {
    const { field } = setup();
    expect(field().placeholder).toBe('Pegá la lista acá');
  });

  it('describes the field with the hint only when there is one', () => {
    const { el, field, update } = setup();
    expect(field().hasAttribute('aria-describedby')).toBe(false);
    update((h) => h.hint.set('Una línea por jugador'));
    const hintId = field().getAttribute('aria-describedby') as string;
    expect(el.querySelector(`#${hintId}`)?.textContent).toContain('Una línea por jugador');
  });

  describe('numbered', () => {
    const numbers = (el: HTMLElement) =>
      Array.from(el.querySelectorAll('[data-gutter] > div')).map((n) => n.textContent?.trim());

    it('shows no line numbers by default', () => {
      const { el } = setup();
      expect(el.querySelector('[data-gutter]')).toBeNull();
    });

    it('numbers the lines with two digits, at least as many as the rows', () => {
      const { el, update } = setup();
      update((h) => {
        h.numbered.set(true);
        h.rows.set(4);
        h.text.set('Diego\nMati');
      });
      expect(numbers(el)).toEqual(['01', '02', '03', '04']);
    });

    it('keeps numbering as the list grows past the rows', () => {
      const { el, update } = setup();
      update((h) => {
        h.numbered.set(true);
        h.rows.set(3);
        h.text.set(Array.from({ length: 11 }, (_, i) => `Jugador ${i + 1}`).join('\n'));
      });
      expect(numbers(el)).toHaveLength(11);
      expect(numbers(el)[10]).toBe('11');
    });

    it('grows the field with its lines, so the numbers always match them', () => {
      const { field, update } = setup();
      update((h) => {
        h.numbered.set(true);
        h.rows.set(3);
        h.text.set('a\nb\nc\nd\ne');
      });
      expect(field().rows).toBe(5);
    });

    it('does not wrap lines, so one line is one number', () => {
      const { field, update } = setup();
      update((h) => h.numbered.set(true));
      expect(field().getAttribute('wrap')).toBe('off');
    });

    it('keeps the numbers out of assistive technology', () => {
      const { el, update } = setup();
      update((h) => h.numbered.set(true));
      expect(el.querySelector('[data-gutter]')?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('hidden label', () => {
    it('keeps the label for assistive technology but not for the eyes', () => {
      const { el, field, update } = setup();
      const label = el.querySelector('label') as HTMLLabelElement;
      expect(label.classList.contains('sr-only')).toBe(false);
      update((h) => h.hideLabel.set(true));
      expect(label.classList.contains('sr-only')).toBe(true);
      expect(label.control).toBe(field());
    });
  });

  it('takes the focus when asked to', () => {
    const { host, field } = setup();
    host.control().focus();
    expect(document.activeElement).toBe(field());
  });
});
