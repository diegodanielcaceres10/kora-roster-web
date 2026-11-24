import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CardAccent, UiCard } from './card';

@Component({
  imports: [UiCard],
  template: `
    <ui-card [accent]="accent()" [accentColor]="accentColor()">
      <h3 card-header>Equipo A</h3>
      <p>Diego, Mati</p>
    </ui-card>
  `,
})
class Host {
  readonly accent = signal<CardAccent | undefined>(undefined);
  readonly accentColor = signal<string | undefined>(undefined);
}

@Component({ imports: [UiCard], template: `<ui-card><p>Solo cuerpo</p></ui-card>` })
class NoHeaderHost {}

@Component({
  imports: [UiCard],
  template: `
    <ui-card>
      <p>Cuerpo</p>
      <div card-footer>Acciones</div>
    </ui-card>
  `,
})
class FooterHost {}

describe('UiCard', () => {
  it('renders the header and the body in separate places', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const header = el.querySelector('header') as HTMLElement;
    const body = el.querySelector('section > div') as HTMLElement;
    expect(header.textContent).toContain('Equipo A');
    expect(header.textContent).not.toContain('Diego');
    expect(body.textContent).toContain('Diego, Mati');
    expect(body.textContent).not.toContain('Equipo A');
  });

  it('leaves the header element empty when no header is projected', () => {
    const fixture = TestBed.createComponent(NoHeaderHost);
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('header') as HTMLElement;
    expect(header.matches(':empty')).toBe(true);
  });

  it('renders the footer below the body, apart from it', () => {
    const fixture = TestBed.createComponent(FooterHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const footer = el.querySelector('footer') as HTMLElement;
    const body = el.querySelector('section > div') as HTMLElement;
    expect(footer.textContent).toContain('Acciones');
    expect(body.textContent).not.toContain('Acciones');
    expect(body.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('leaves the footer element empty when no footer is projected', () => {
    const fixture = TestBed.createComponent(NoHeaderHost);
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('footer') as HTMLElement;
    expect(footer.matches(':empty')).toBe(true);
  });

  it('shows a different edge for every accent, and none by default', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = () => fixture.nativeElement.querySelector('section') as HTMLElement;
    const looks = new Set<string>([section().className]);
    for (const accent of ['primary', 'secondary', 'alternative'] as const) {
      fixture.componentInstance.accent.set(accent);
      fixture.detectChanges();
      looks.add(section().className);
    }
    expect(looks.size).toBe(4);
  });

  it('applies custom border top color when accentColor is given', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.accentColor.set('#ffea00');
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.style.borderTopColor).toBe('rgb(255, 234, 0)');
    expect(section.style.borderTopWidth).toBe('4px');
  });
});
