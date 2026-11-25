import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiBadge } from '../badge/badge';

// The logo of Kora: the mark, the name and the Roster tag, on one horizontal center line.
// The names are the brand, which reads the same in every language, so they live here and not
// in the dictionaries. It has no link of its own: each page decides where it goes.
@Component({
  selector: 'ui-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiBadge],
  host: { class: 'inline-flex items-center gap-2.5 leading-none text-ink' },
  templateUrl: './logo.html',
})
export class UiLogo {}
