import { browserStorage } from './storage';

describe('browserStorage', () => {
  it('gives the local storage of the page', () => {
    expect(browserStorage(document)).toBe(window.localStorage);
  });

  it('gives nothing when there is no window, as while prerendering', () => {
    expect(browserStorage({ defaultView: null } as unknown as Document)).toBeNull();
  });

  it('gives nothing when the browser blocks the storage', () => {
    const blocked = {
      defaultView: {
        get localStorage(): Storage {
          throw new DOMException('blocked', 'SecurityError');
        },
      },
    } as unknown as Document;
    expect(browserStorage(blocked)).toBeNull();
  });
});
