import { readFileSync } from 'node:fs';

// The files are read as text on purpose: the build swaps one for the other, so
// importing them would only ever show the one in use.
const FILES = ['src/environments/environment.ts', 'src/environments/environment.development.ts'];

const withoutComments = (source: string) =>
  source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
const setting = (source: string, key: string) =>
  new RegExp(`${key}:\\s*'([^']*)'`).exec(source)?.[1];

describe.each(FILES)('%s', (file) => {
  const source = readFileSync(file, 'utf8');

  it('has a client id that is empty or looks like one from Google', () => {
    expect(setting(source, 'googleClientId')).toMatch(
      /^([A-Za-z0-9-]+\.apps\.googleusercontent\.com)?$/,
    );
  });

  it('has a site address that is empty or just an origin, without a path', () => {
    expect(setting(source, 'siteUrl')).toMatch(/^(https?:\/\/[^/\s]+)?$/);
  });

  it('holds only the known settings, so nothing sensitive slips in', () => {
    const keys = [...withoutComments(source).matchAll(/^\s+(\w+):/gm)].map((match) => match[1]);
    expect(keys.sort()).toEqual(['googleClientId', 'siteUrl']);
  });
});

describe('the production environment', () => {
  it('uses a secure site address', () => {
    const source = readFileSync('src/environments/environment.ts', 'utf8');
    expect(setting(source, 'siteUrl')).toMatch(/^(https:\/\/[^/\s]+)?$/);
  });
});
