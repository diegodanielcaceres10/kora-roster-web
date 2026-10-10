import { Routes } from '@angular/router';
import { SUPPORTED_LANGS } from './i18n/languages';
import { langGuard } from './i18n/lang.guard';
import { RedirectToLanguage } from './i18n/redirect-to-language';
import { Shell } from './layout/shell';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: RedirectToLanguage },
  // One fixed route per language, so prerendering finds every page on its own.
  ...SUPPORTED_LANGS.map((lang) => ({
    path: lang,
    component: Shell,
    canActivate: [langGuard],
    data: { lang },
    children: [
      { path: '', loadComponent: () => import('./pages/landing/landing').then((m) => m.Landing) },
      {
        path: 'amistoso',
        loadComponent: () => import('./pages/tool/tool').then((m) => m.Tool),
      },
    ],
  })),
  {
    path: 'design-system',
    loadComponent: () => import('./design-system/design-system').then((m) => m.DesignSystem),
  },
  { path: '**', redirectTo: '' },
];
