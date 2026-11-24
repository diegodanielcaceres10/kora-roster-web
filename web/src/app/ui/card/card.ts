import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type CardAccent = 'primary' | 'secondary' | 'alternative';

const ACCENTS: Record<CardAccent, string> = {
  primary: 'border-t-4 border-t-primary',
  secondary: 'border-t-4 border-t-slate-600 dark:border-t-slate-400',
  alternative: 'border-t-4 border-t-alternative',
};

@Component({
  selector: 'ui-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './card.html',
})
export class UiCard {
  readonly accent = input<CardAccent | undefined>(undefined);
  readonly accentColor = input<string | undefined>(undefined);

  protected readonly accentClass = computed(() => {
    if (this.accentColor()) return '';
    const accent = this.accent();
    return accent ? ACCENTS[accent] : '';
  });
}
