import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n } from '../i18n/i18n';
import { UiIcon, UiIconButton } from '../ui';
import { Theme } from './theme';

// The moon asks for dark mode, the sun for light mode: the icon shows where it will go.
@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIconButton, UiIcon],
  host: { class: 'inline-flex' },
  template: `
    <ui-icon-button [label]="label()" (click)="theme.toggle()">
      <ui-icon [name]="theme.mode() === 'dark' ? 'sun' : 'moon'" />
    </ui-icon-button>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(Theme);
  private readonly i18n = inject(I18n);

  protected label(): string {
    const text = this.i18n.t().theme;
    return this.theme.mode() === 'dark' ? text.toLight : text.toDark;
  }
}
