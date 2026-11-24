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
  templateUrl: './list-row.html',
  styleUrl: './list-row.css',
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
