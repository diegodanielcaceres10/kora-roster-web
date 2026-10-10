import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { I18n } from './i18n';
import { isLang } from './languages';

// Runs before the page is drawn, so prerendering also sees the right language.
export const langGuard: CanActivateFn = (route) => {
  const lang = route.data['lang'];
  if (typeof lang !== 'string' || !isLang(lang)) return false;
  inject(I18n).setLang(lang);
  return true;
};
