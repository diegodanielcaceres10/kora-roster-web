import { layoutStory, StoryInput, StoryLayout } from '../core/story-layout';
import {
  canvasMeasure,
  createStoryBlob,
  drawStory,
  loadStoryLogo,
  LOGO_URL,
  STORY_FONT,
} from './story-image';

interface Drawn {
  text: string;
  x: number;
  y: number;
  font: string;
  fill: string;
  align: string;
  baseline: string;
}

function fakeContext() {
  const events: string[] = [];
  const filled: { fill: string; arcs: number; closed: boolean }[] = [];
  const texts: Drawn[] = [];
  const radii: number[] = [];
  const outlines: { color: string; width: number }[] = [];
  const images: unknown[][] = [];
  let arcs = 0;
  let closed = false;
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
    fillRect: vi.fn(function (this: typeof ctx, ...args: number[]) {
      events.push(`background:${this.fillStyle}:${args.join(',')}`);
    }),
    beginPath: vi.fn(() => {
      arcs = 0;
      closed = false;
    }),
    moveTo: vi.fn(),
    arcTo: vi.fn((...args: number[]) => {
      arcs++;
      radii.push(args[4] as number);
    }),
    closePath: vi.fn(() => {
      closed = true;
    }),
    fill: vi.fn(function (this: typeof ctx) {
      filled.push({ fill: this.fillStyle, arcs, closed });
      events.push('rect');
    }),
    stroke: vi.fn(function (this: typeof ctx) {
      outlines.push({ color: this.strokeStyle, width: this.lineWidth });
      events.push('stroke');
    }),
    fillText: vi.fn(function (this: typeof ctx, text: string, x: number, y: number) {
      texts.push({
        text,
        x,
        y,
        font: this.font,
        fill: this.fillStyle,
        align: this.textAlign,
        baseline: this.textBaseline,
      });
      events.push('text');
    }),
    drawImage: vi.fn((...args: unknown[]) => {
      images.push(args);
      events.push('image');
    }),
    measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
  };
  return {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    raw: ctx,
    events,
    filled,
    texts,
    radii,
    outlines,
    images,
  };
}

const layout: StoryLayout = {
  width: 1080,
  height: 1920,
  background: '#1b2a41',
  commands: [
    {
      kind: 'text',
      role: 'header',
      x: 540,
      y: 80,
      text: 'Header',
      size: 64,
      weight: 'bold',
      color: '#ffffff',
      align: 'center',
    },
    {
      kind: 'rect',
      role: 'panel',
      x: 48,
      y: 200,
      width: 984,
      height: 600,
      radius: 36,
      fill: '#e53935',
    },
    {
      kind: 'text',
      role: 'title',
      x: 80,
      y: 260,
      text: '🔴 Team 1',
      size: 56,
      weight: 'bold',
      color: '#111111',
      align: 'left',
    },
    {
      kind: 'text',
      role: 'player',
      x: 80,
      y: 340,
      text: '1. Jugador A 🧤',
      size: 40,
      weight: 'normal',
      color: '#111111',
      align: 'left',
    },
    {
      kind: 'rect',
      role: 'panel',
      x: 48,
      y: 824,
      width: 40,
      height: 20,
      radius: 36,
      fill: '#1e88e5',
    },
  ],
};

describe('drawStory', () => {
  it('paints the background over the whole page first', () => {
    const { ctx, events } = fakeContext();
    drawStory(ctx, layout);
    expect(events[0]).toBe('background:#1b2a41:0,0,1080,1920');
  });

  it('keeps the order of the commands', () => {
    const { ctx, events } = fakeContext();
    drawStory(ctx, layout);
    expect(events.slice(1)).toEqual(['text', 'rect', 'text', 'text', 'rect']);
  });

  it('fills every block with its color, along a closed path with four rounded corners', () => {
    const { ctx, filled } = fakeContext();
    drawStory(ctx, layout);
    expect(filled).toEqual([
      { fill: '#e53935', arcs: 4, closed: true },
      { fill: '#1e88e5', arcs: 4, closed: true },
    ]);
  });

  it('never rounds a corner more than half of the shortest side', () => {
    const { ctx, radii } = fakeContext();
    drawStory(ctx, layout);
    expect(Math.max(...radii.slice(4))).toBe(10);
    expect(Math.max(...radii.slice(0, 4))).toBe(36);
  });

  it('writes each text where the layout says, with its color, alignment and a middle baseline', () => {
    const { ctx, texts } = fakeContext();
    drawStory(ctx, layout);
    expect(texts.map((t) => [t.text, t.x, t.y, t.fill, t.align, t.baseline])).toEqual([
      ['Header', 540, 80, '#ffffff', 'center', 'middle'],
      ['🔴 Team 1', 80, 260, '#111111', 'left', 'middle'],
      ['1. Jugador A 🧤', 80, 340, '#111111', 'left', 'middle'],
    ]);
  });

  describe('an outline', () => {
    const outlined: StoryLayout = {
      width: 1080,
      height: 1920,
      background: '#eef2f7',
      commands: [
        {
          kind: 'rect',
          role: 'plate',
          x: 36,
          y: 36,
          width: 1008,
          height: 1848,
          radius: 56,
          fill: '#ffffff',
          stroke: { color: '#d9e2ec', width: 3 },
        },
        {
          kind: 'rect',
          role: 'title-bar',
          x: 60,
          y: 60,
          width: 400,
          height: 80,
          radius: 26,
          fill: '#e53935',
        },
      ],
    };

    it('is drawn right after the fill of the rectangle that has one, with its color and width', () => {
      const { ctx, events, outlines } = fakeContext();
      drawStory(ctx, outlined);
      expect(events.slice(1)).toEqual(['rect', 'stroke', 'rect']);
      expect(outlines).toEqual([{ color: '#d9e2ec', width: 3 }]);
    });

    it('is not drawn for a rectangle that has none', () => {
      const { ctx, outlines } = fakeContext();
      drawStory(ctx, layout);
      expect(outlines).toEqual([]);
    });

    it('follows the same rounded shape as the fill', () => {
      const { ctx, radii } = fakeContext();
      drawStory(ctx, outlined);
      // One path per rectangle, four arcs each, and the outline reuses the path of its fill.
      expect(radii).toHaveLength(8);
    });
  });

  it('sets the weight and the size in the font, with emoji fonts as a fallback', () => {
    const { ctx, texts } = fakeContext();
    drawStory(ctx, layout);
    expect(texts[0].font).toBe(`bold 64px ${STORY_FONT}`);
    expect(texts[2].font).toBe(`normal 40px ${STORY_FONT}`);
    expect(STORY_FONT).toContain('Noto Color Emoji');
    expect(STORY_FONT).toContain('Apple Color Emoji');
    expect(STORY_FONT).toContain('Segoe UI Emoji');
    expect(STORY_FONT.endsWith('sans-serif')).toBe(true);
  });

  it('has only names that every canvas accepts, because an invalid font is ignored without an error', () => {
    // A name that starts with a hyphen, such as -apple-system, is rejected by some parsers and
    // the text would then be drawn at 10px.
    const names = STORY_FONT.split(',').map((name) => name.trim());
    for (const name of names) expect(name.startsWith('-'), name).toBe(false);
  });
});

describe('the logo', () => {
  const withLogo: StoryLayout = {
    width: 1080,
    height: 1920,
    background: '#ffffff',
    commands: [
      { kind: 'rect', role: 'plate', x: 36, y: 100, width: 1008, height: 800, radius: 48, fill: '#fff' },
      { kind: 'image', role: 'logo', x: 72, y: 124, width: 56, height: 56 },
      {
        kind: 'text',
        role: 'wordmark',
        x: 142,
        y: 152,
        text: 'KORA',
        size: 34,
        weight: 'bold',
        color: '#0f172a',
        align: 'left',
      },
    ],
  };
  const logo = { width: 256, height: 256 } as unknown as CanvasImageSource;

  it('is drawn where the layout says, between the blocks and the texts that go around it', () => {
    const { ctx, raw, events, images } = fakeContext();
    drawStory(ctx, withLogo, logo);
    expect(raw.drawImage).toHaveBeenCalledTimes(1);
    expect(images[0]).toEqual([logo, 72, 124, 56, 56]);
    expect(events).toEqual(['background:#ffffff:0,0,1080,1920', 'rect', 'image', 'text']);
  });

  it('is left out, with everything else drawn, when the image could not be loaded', () => {
    const { ctx, raw, events } = fakeContext();
    drawStory(ctx, withLogo, null);
    expect(raw.drawImage).not.toHaveBeenCalled();
    expect(events).toEqual(['background:#ffffff:0,0,1080,1920', 'rect', 'text']);
  });

  it('is left out too when none is given', () => {
    const { ctx, raw } = fakeContext();
    drawStory(ctx, withLogo);
    expect(raw.drawImage).not.toHaveBeenCalled();
  });
});

describe('loadStoryLogo', () => {
  function fakeImage() {
    const image: { src: string; onload: (() => void) | null; onerror: (() => void) | null } = {
      src: '',
      onload: null,
      onerror: null,
    };
    return image;
  }

  afterEach(() => vi.useRealTimers());

  it('loads the favicon of the site, which is the same mark as the one in the header', async () => {
    const image = fakeImage();
    const loading = loadStoryLogo(() => image as unknown as HTMLImageElement);
    expect(image.src).toBe(LOGO_URL);
    expect(LOGO_URL).toBe('favicon.png');
    image.onload?.();
    await expect(loading).resolves.toBe(image);
  });

  it('gives back nothing, instead of failing, when the image cannot be loaded', async () => {
    const image = fakeImage();
    const loading = loadStoryLogo(() => image as unknown as HTMLImageElement);
    image.onerror?.();
    await expect(loading).resolves.toBeNull();
  });

  it('does not wait for ever for an image that never answers', async () => {
    vi.useFakeTimers();
    const image = fakeImage();
    const loading = loadStoryLogo(() => image as unknown as HTMLImageElement);
    await vi.advanceTimersByTimeAsync(5000);
    await expect(loading).resolves.toBeNull();
  });

  it('ignores an answer that arrives after it gave up', async () => {
    vi.useFakeTimers();
    const image = fakeImage();
    const loading = loadStoryLogo(() => image as unknown as HTMLImageElement);
    await vi.advanceTimersByTimeAsync(5000);
    image.onload?.();
    await expect(loading).resolves.toBeNull();
  });
});

describe('canvasMeasure', () => {
  it('measures with the same font that will be used to draw', () => {
    const { ctx, raw } = fakeContext();
    const measure = canvasMeasure(ctx);
    expect(measure('abcd', 30, 'bold')).toBe(40);
    expect(raw.font).toBe(`bold 30px ${STORY_FONT}`);
    expect(raw.measureText).toHaveBeenCalledWith('abcd');
  });
});

describe('createStoryBlob', () => {
  const story: StoryInput = {
    teams: [
      {
        title: 'Team 1',
        color: '#e53935',
        players: [{ name: 'Jugador A', isGoalkeeper: true }],
      },
      {
        title: 'Team 2',
        color: '#1e88e5',
        players: [{ name: 'Jugador E', isGoalkeeper: false }],
      },
    ],
    header: 'Header',
    footer: '',
    numbering: 'dot',
    confirmed: 'confirmed',
    brand: 'Made with Kora Roster',
  };

  const noLogo = () => Promise.resolve(null);

  function fakeCanvas(options: { context?: boolean; blob?: boolean } = {}) {
    const { ctx, raw, texts } = fakeContext();
    const blob = new Blob(['png'], { type: 'image/png' });
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => (options.context === false ? null : ctx)),
      toBlob: vi.fn((callback: (b: Blob | null) => void) =>
        callback(options.blob === false ? null : blob),
      ),
    };
    return { canvas: canvas as unknown as HTMLCanvasElement, raw: canvas, ctx: raw, texts, blob };
  }

  it('draws the story on a canvas of 1080 by 1920 and gives back the PNG', async () => {
    const { canvas, raw, blob, texts } = fakeCanvas();
    await expect(createStoryBlob(story, () => canvas, noLogo)).resolves.toBe(blob);
    expect([raw.width, raw.height]).toEqual([1080, 1920]);
    expect(raw.getContext).toHaveBeenCalledWith('2d');
    expect(raw.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
    expect(texts.map((t) => t.text)).toContain('Team 1');
  });

  it('measures the text with the canvas that will draw it', async () => {
    const { canvas, ctx } = fakeCanvas();
    await createStoryBlob(story, () => canvas, noLogo);
    expect(ctx.measureText).toHaveBeenCalled();
  });

  it('matches the layout that the pure function gives for the same measurements', async () => {
    const { canvas, texts } = fakeCanvas();
    await createStoryBlob(story, () => canvas, noLogo);
    const expected = layoutStory(story, (text) => text.length * 10).commands.filter(
      (c) => c.kind === 'text',
    );
    expect(texts.map((t) => t.text)).toEqual(
      expected.map((c) => (c.kind === 'text' ? c.text : '')),
    );
  });

  it('draws the logo that it loads, in the place of the layout', async () => {
    const { canvas, ctx } = fakeCanvas();
    const logo = { width: 256, height: 256 } as unknown as CanvasImageSource;
    await createStoryBlob(story, () => canvas, () => Promise.resolve(logo));
    const expected = layoutStory(story, (text) => text.length * 10).commands.find(
      (c) => c.kind === 'image',
    );
    expect(ctx.drawImage).toHaveBeenCalledTimes(1);
    expect(expected).toBeDefined();
    if (expected?.kind === 'image') {
      expect(ctx.drawImage).toHaveBeenCalledWith(
        logo,
        expected.x,
        expected.y,
        expected.width,
        expected.height,
      );
    }
  });

  it('still makes the image, without the logo, when the logo cannot be loaded', async () => {
    const { canvas, ctx, blob } = fakeCanvas();
    await expect(createStoryBlob(story, () => canvas, noLogo)).resolves.toBe(blob);
    expect(ctx.drawImage).not.toHaveBeenCalled();
  });

  it('still makes the image when loading the logo throws', async () => {
    const { canvas, ctx, blob } = fakeCanvas();
    await expect(
      createStoryBlob(story, () => canvas, () => Promise.reject(new Error('offline'))),
    ).resolves.toBe(blob);
    expect(ctx.drawImage).not.toHaveBeenCalled();
  });

  it('fails clearly when the browser gives no drawing context', async () => {
    const { canvas } = fakeCanvas({ context: false });
    await expect(createStoryBlob(story, () => canvas, noLogo)).rejects.toThrow('2D canvas');
  });

  it('fails clearly when the browser cannot produce the image', async () => {
    const { canvas } = fakeCanvas({ blob: false });
    await expect(createStoryBlob(story, () => canvas, noLogo)).rejects.toThrow('image');
  });
});
