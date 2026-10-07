import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  BadgeTone,
  ButtonVariant,
  CardAccent,
  SegmentedOption,
  ToastService,
  UiBadge,
  UiButton,
  UiCard,
  UiIconButton,
  UiListRow,
  UiSegmented,
  UiTextarea,
} from '../ui';

@Component({
  selector: 'app-design-system',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiBadge, UiButton, UiCard, UiIconButton, UiListRow, UiSegmented, UiTextarea],
  templateUrl: './design-system.html',
})
export class DesignSystem {
  private readonly toast = inject(ToastService);

  protected readonly colors = [
    {
      name: 'primary',
      hex: '#ffb627',
      swatch: 'bg-primary',
      usage: 'Acciones principales. Texto en secondary.',
    },
    {
      name: 'secondary',
      hex: '#1b2a41',
      swatch: 'bg-secondary',
      usage: 'Texto, títulos y fondos oscuros.',
    },
    {
      name: 'alternative',
      hex: '#0b8457',
      swatch: 'bg-alternative',
      usage: 'Acento verde. Texto en blanco.',
    },
  ];
  protected readonly variants: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost'];
  protected readonly teams: { title: string; accent: CardAccent; players: string }[] = [
    { title: 'Equipo A', accent: 'primary', players: 'Diego, Mati, Nico' },
    { title: 'Equipo B', accent: 'secondary', players: 'Lucho, Fede, Santi' },
    { title: 'Equipo C', accent: 'alternative', players: 'Gonza, Tomi, Ale' },
  ];
  protected readonly badges: { tone: BadgeTone; text: string }[] = [
    { tone: 'neutral', text: 'Confirmado' },
    { tone: 'primary', text: 'Dudoso' },
    { tone: 'alternative', text: 'Arquero' },
    { tone: 'danger', text: 'Baja' },
  ];
  protected readonly languages: SegmentedOption[] = [
    { value: 'en', label: 'EN' },
    { value: 'es', label: 'ES' },
    { value: 'pt', label: 'PT' },
  ];

  protected readonly goalkeeper = signal(false);
  protected readonly language = signal('es');
  protected readonly empty = signal('');
  protected readonly withHint = signal('');
  protected readonly filled = signal('1. Diego 🧤\n2. Mati\n3. Nico (dudoso)');

  protected toggleGoalkeeper(): void {
    this.goalkeeper.update((on) => !on);
  }

  protected showToast(): void {
    this.toast.show('Copiado');
  }
}
