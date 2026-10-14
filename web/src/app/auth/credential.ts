export interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

// Reads the payload of a JWT. It does not check the signature: without a server the
// browser cannot, so this only turns the token into data.
export function decodeCredential(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return typeof payload === 'object' && payload !== null && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

// Accepts only a token Google issued, for this app, that has not expired.
export function claimsToUser(
  payload: unknown,
  { clientId, now }: { clientId: string; now: number },
): AuthUser | null {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return null;
  const { iss, aud, exp, sub, email, name, picture } = payload as Record<string, unknown>;

  if (typeof iss !== 'string' || !GOOGLE_ISSUERS.includes(iss)) return null;
  if (!clientId || aud !== clientId) return null;
  if (typeof exp !== 'number' || !Number.isFinite(exp) || exp * 1000 <= now) return null;
  if (typeof sub !== 'string' || !sub) return null;
  if (typeof email !== 'string' || !email) return null;

  return {
    id: sub,
    name: typeof name === 'string' && name ? name : email,
    email,
    picture: typeof picture === 'string' && picture.startsWith('https://') ? picture : '',
  };
}
