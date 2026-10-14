import { Environment } from './environment.model';

// Production settings, used by `npm run build`. The development build swaps this file for
// environment.development.ts (see angular.json).
//
// None of these values is secret: the client id and the site address are public and anyone
// can read them in the page. Never add a client secret, API key or password here.
export const environment: Environment = {
  // OAuth client id from Google Cloud Console, like '1234-abc.apps.googleusercontent.com'.
  // Empty keeps sign in off.
  googleClientId: '715944364484-ss23g6uaeqkvm06efffhvq88go0ldtpr.apps.googleusercontent.com',
  // Public address of the site, like 'https://example.com'. Empty writes no canonical or
  // hreflang links.
  siteUrl: '',
};
