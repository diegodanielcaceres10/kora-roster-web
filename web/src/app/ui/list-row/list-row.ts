import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'ui-list-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
    class:
      'flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors duration-150 hover:border-line hover:bg-surface-muted',
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
  // A row that stands as a tile of its own: always bordered, on a muted background.
  readonly tile = input(false, { transform: booleanAttribute });

  protected readonly stateClasses = computed(() => {
    if (this.highlight()) return 'border-l-4 border-primary bg-primary/15 border-line';
    return this.tile() ? 'border-line bg-surface-muted/60' : '';
  });
}
