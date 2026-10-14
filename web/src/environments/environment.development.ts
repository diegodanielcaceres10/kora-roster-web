import { Environment } from './environment.model';

// Local settings, used by `ng serve` and the Docker container. They replace
// environment.ts when the development configuration is built (see angular.json).
//
// None of these values is secret: the client id and the site address are public and anyone
// can read them in the page. Never add a client secret, API key or password here.
export const environment: Environment = {
  // OAuth client id from Google Cloud Console, like '1234-abc.apps.googleusercontent.com'.
  // Its authorized origins must include http://localhost:4004. Empty keeps sign in off.
  googleClientId: '715944364484-ss23g6uaeqkvm06efffhvq88go0ldtpr.apps.googleusercontent.com',
  // Leave empty locally: the canonical and hreflang links only make sense on the real site.
  siteUrl: '',
};
