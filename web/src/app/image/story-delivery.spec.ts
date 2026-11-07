import { canShareStory, downloadStory, shareStory, storyFileName } from './story-delivery';

const BLOB = new Blob(['png'], { type: 'image/png' });

function setNavigator(members: Record<string, unknown>) {
  for (const [key, value] of Object.entries(members)) {
    Object.defineProperty(navigator, key, { value, configurable: true });
  }
}

describe('storyFileName', () => {
  it('is kora-roster plus the date, with two digits for the month and the day', () => {
    expect(storyFileName(new Date(2026, 0, 5))).toBe('kora-roster-2026-01-05.png');
    expect(storyFileName(new Date(2026, 10, 7))).toBe('kora-roster-2026-11-07.png');
    expect(storyFileName(new Date(2027, 11, 31))).toBe('kora-roster-2027-12-31.png');
  });

  it('uses the date of the person, not the one in another time zone', () => {
    const lateAtNight = new Date(2026, 5, 9, 23, 59, 59);
    expect(storyFileName(lateAtNight)).toBe('kora-roster-2026-06-09.png');
  });
});

describe('canShareStory', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'canShare');
    Reflect.deleteProperty(navigator, 'share');
  });

  it('is false when the browser cannot share at all', () => {
    expect(canShareStory(BLOB, 'a.png')).toBe(false);
  });

  it('asks the browser whether it can share that image as a file', () => {
    const canShare = vi.fn(() => true);
    setNavigator({ canShare });
    expect(canShareStory(BLOB, 'story.png')).toBe(true);
    const [{ files }] = canShare.mock.calls[0] as unknown as [{ files: File[] }];
    expect(files).toHaveLength(1);
    expect([files[0].name, files[0].type]).toEqual(['story.png', 'image/png']);
  });

  it('is false when the browser says it cannot share files', () => {
    setNavigator({ canShare: () => false });
    expect(canShareStory(BLOB, 'a.png')).toBe(false);
  });
});

describe('shareStory', () => {
  afterEach(() => Reflect.deleteProperty(navigator, 'share'));

  it('shares the image as a file with its name', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator({ share });
    await expect(shareStory(BLOB, 'story.png')).resolves.toBe('shared');
    const [{ files }] = share.mock.calls[0] as unknown as [{ files: File[] }];
    expect([files[0].name, files[0].type]).toEqual(['story.png', 'image/png']);
  });

  it('is "cancelled", not an error, when the person closes the sharing panel', async () => {
    setNavigator({
      share: vi.fn().mockRejectedValue(new DOMException('Share canceled', 'AbortError')),
    });
    await expect(shareStory(BLOB, 'a.png')).resolves.toBe('cancelled');
  });

  it('fails for any other reason', async () => {
    setNavigator({ share: vi.fn().mockRejectedValue(new DOMException('No', 'NotAllowedError')) });
    await expect(shareStory(BLOB, 'a.png')).rejects.toThrow('No');
    setNavigator({ share: vi.fn().mockRejectedValue(new Error('boom')) });
    await expect(shareStory(BLOB, 'a.png')).rejects.toThrow('boom');
  });
});

describe('downloadStory', () => {
  it('clicks a link to the image with the file name, and leaves nothing in the page', () => {
    const seen: { href: string; download: string; inPage: boolean }[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      seen.push({ href: this.href, download: this.download, inPage: document.body.contains(this) });
    });
    downloadStory('blob:https://kora.test/abc', 'story.png');
    expect(click).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([
      { href: 'blob:https://kora.test/abc', download: 'story.png', inPage: true },
    ]);
    expect(document.querySelector('a[download]')).toBeNull();
    click.mockRestore();
  });
});
