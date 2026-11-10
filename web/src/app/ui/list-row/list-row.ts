import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'ui-list-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
    class:
      'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-secondary/[0.03] border border-transparent hover:border-secondary/10',
    '[class]': 'stateClasses()',
  },
  template: `
    <div class="shrink-0"><ng-content select="[row-start]" /></div>
    <div class="min-w-0 flex-1"><ng-content /></div>
    <div class="flex shrink-0 items-center gap-1.5"><ng-content select="[row-end]" /></div>
  `,
})
export class UiListRow {
  readonly highlight = input(false);

  protected readonly stateClasses = computed(() =>
    this.highlight() ? 'border-l-4 border-primary bg-primary/15 border-secondary/10' : '',
  );
}
