import { claimsToUser, decodeCredential } from './credential';

const CLIENT_ID = 'client-123.apps.googleusercontent.com';
const NOW = 1_800_000_000_000;
const IN_ONE_HOUR = NOW / 1000 + 3600;

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function jwt(payload: unknown): string {
  const encode = (value: unknown) => base64url(new TextEncoder().encode(JSON.stringify(value)));
  return `${encode({ alg: 'RS256' })}.${encode(payload)}.signature`;
}

const validPayload = {
  iss: 'https://accounts.google.com',
  aud: CLIENT_ID,
  exp: IN_ONE_HOUR,
  sub: '1122334455',
  name: 'Diego Cáceres',
  email: 'diego@example.com',
  picture: 'https://lh3.googleusercontent.com/a/photo=s96-c',
};

const user = (payload: unknown) => claimsToUser(payload, { clientId: CLIENT_ID, now: NOW });

describe('decodeCredential', () => {
  it('reads the payload of a token', () => {
    expect(decodeCredential(jwt({ sub: '1' }))).toEqual({ sub: '1' });
  });

  it.each([['José Ñandú'], ['李雷'], ['Zoë 🧤']])('keeps the name %j intact', (name) => {
    expect(decodeCredential(jwt({ name }))).toEqual({ name });
  });

  it.each([
    [''],
    ['not-a-token'],
    ['only.two'],
    ['a.b.c.d'],
    ['header.!!!.signature'],
    [`header.${base64url(new TextEncoder().encode('not json'))}.signature`],
    [`header.${base64url(new TextEncoder().encode('[1,2]'))}.signature`],
    [`header.${base64url(new TextEncoder().encode('"text"'))}.signature`],
  ])('returns nothing for the malformed token %j', (token) => {
    expect(decodeCredential(token)).toBeNull();
  });
});

describe('claimsToUser', () => {
  it('builds the user from a valid token', () => {
    expect(user(validPayload)).toEqual({
      id: '1122334455',
      name: 'Diego Cáceres',
      email: 'diego@example.com',
      picture: 'https://lh3.googleusercontent.com/a/photo=s96-c',
    });
  });

  it.each(['accounts.google.com', 'https://accounts.google.com'])(
    'accepts the issuer %s',
    (iss) => {
      expect(user({ ...validPayload, iss })).not.toBeNull();
    },
  );

  it.each([['https://evil.example'], ['google.com'], [undefined], [42]])(
    'rejects the issuer %j',
    (iss) => {
      expect(user({ ...validPayload, iss })).toBeNull();
    },
  );

  it.each([['another-client.apps.googleusercontent.com'], [''], [undefined], [['x', CLIENT_ID]]])(
    'rejects the audience %j',
    (aud) => {
      expect(user({ ...validPayload, aud })).toBeNull();
    },
  );

  it('rejects a token that is already expired, or expires right now', () => {
    expect(user({ ...validPayload, exp: NOW / 1000 - 1 })).toBeNull();
    expect(user({ ...validPayload, exp: NOW / 1000 })).toBeNull();
  });

  it.each([['soon'], [undefined], [null], [NaN]])('rejects the expiration %j', (exp) => {
    expect(user({ ...validPayload, exp })).toBeNull();
  });

  it.each([['sub'], ['email']])('rejects a token without %s', (field) => {
    expect(user({ ...validPayload, [field]: undefined })).toBeNull();
    expect(user({ ...validPayload, [field]: '' })).toBeNull();
  });

  it('uses the email as the name when Google sends none', () => {
    expect(user({ ...validPayload, name: undefined })?.name).toBe('diego@example.com');
  });

  it.each([[undefined], [''], ['http://insecure.example/p.jpg'], ['javascript:alert(1)'], [7]])(
    'leaves the picture empty for %j',
    (picture) => {
      expect(user({ ...validPayload, picture })?.picture).toBe('');
    },
  );

  it.each([[null], ['text'], [42], [undefined]])('rejects a payload that is %j', (payload) => {
    expect(user(payload)).toBeNull();
  });
});
