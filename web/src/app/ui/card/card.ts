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
  template: `
    <section
      class="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs transition-shadow duration-200 hover:shadow-md"
      [class]="accentClass()"
    >
      <header class="border-b border-line bg-surface-muted/60 px-4 py-3 sm:px-5 empty:hidden"><ng-content select="[card-header]" /></header>
      <div class="p-4 sm:p-5"><ng-content /></div>
    </section>
  `,
})
export class UiCard {
  readonly accent = input<CardAccent | undefined>(undefined);

  protected readonly accentClass = computed(() => {
    const accent = this.accent();
    return accent ? ACCENTS[accent] : '';
  });
}
