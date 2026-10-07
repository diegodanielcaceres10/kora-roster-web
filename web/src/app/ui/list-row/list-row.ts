import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'ui-list-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
    class: 'flex items-center gap-3 rounded-lg px-3 py-2',
    '[class]': 'stateClasses()',
  },
  template: `
    <div class="shrink-0"><ng-content select="[row-start]" /></div>
    <div class="min-w-0 flex-1"><ng-content /></div>
    <div class="flex shrink-0 items-center gap-1"><ng-content select="[row-end]" /></div>
  `,
})
export class UiListRow {
  readonly highlight = input(false);

  protected readonly stateClasses = computed(() =>
    this.highlight() ? 'border-l-4 border-primary bg-primary/15' : '',
  );
}
