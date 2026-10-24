// Helpers for specs, not used by the app: a person who signed in earlier, with or without
// preferences already saved in the browser.
import { Preferences } from './preferences';

export const TEST_ACCOUNT = {
  id: '1122334455',
  name: 'Diego Cáceres',
  email: 'diego@example.com',
  picture: '',
};

export const TEST_PREFERENCES: Preferences = {
  playersPerTeam: 7,
  teams: [
    { icon: '🟢', color: '#00ff00' },
    { icon: '🟡', color: '#ffff00' },
  ],
  header: '⚽ Amistoso',
  footer: 'Confirmen',
  numbering: 'paren',
};

export function saveSession(preferences?: Preferences): void {
  localStorage.setItem('kora:session', JSON.stringify(TEST_ACCOUNT));
  if (preferences) {
    localStorage.setItem(
      `kora:prefs:${TEST_ACCOUNT.id}`,
      JSON.stringify({ version: 1, preferences }),
    );
  }
}
