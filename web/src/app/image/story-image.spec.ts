import { layoutStory, StoryInput, StoryLayout } from '../core/story-layout';
import { canvasMeasure, createStoryBlob, drawStory, STORY_FONT } from './story-image';

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
  let arcs = 0;
  let closed = false;
  const ctx = {
    fillStyle: '',
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
    measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
  };
  return {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    raw: ctx,
    events,
    filled,
    texts,
    radii,
  };
}

const layout: StoryLayout = {
  width: 1080,
  height: 1920,
  background: '#1b2a41',
  commands: [
    {
      kind: 'text',
      x: 540,
      y: 80,
      text: 'Header',
      size: 64,
      weight: 'bold',
      color: '#ffffff',
      align: 'center',
    },
    { kind: 'rect', x: 48, y: 200, width: 984, height: 600, radius: 36, fill: '#e53935' },
    {
      kind: 'text',
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
      x: 80,
      y: 340,
      text: '1. Diego 🧤',
      size: 40,
      weight: 'normal',
      color: '#111111',
      align: 'left',
    },
    { kind: 'rect', x: 48, y: 824, width: 40, height: 20, radius: 36, fill: '#1e88e5' },
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
      ['1. Diego 🧤', 80, 340, '#111111', 'left', 'middle'],
    ]);
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
        icon: '🔴',
        title: 'Team 1',
        color: '#e53935',
        players: [{ name: 'Diego', isGoalkeeper: true }],
      },
      {
        icon: '🔵',
        title: 'Team 2',
        color: '#1e88e5',
        players: [{ name: 'Mati', isGoalkeeper: false }],
      },
    ],
    header: 'Header',
    footer: '',
    numbering: 'dot',
  };

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
    await expect(createStoryBlob(story, () => canvas)).resolves.toBe(blob);
    expect([raw.width, raw.height]).toEqual([1080, 1920]);
    expect(raw.getContext).toHaveBeenCalledWith('2d');
    expect(raw.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
    expect(texts.map((t) => t.text)).toContain('🔴 Team 1');
  });

  it('measures the text with the canvas that will draw it', async () => {
    const { canvas, ctx } = fakeCanvas();
    await createStoryBlob(story, () => canvas);
    expect(ctx.measureText).toHaveBeenCalled();
  });

  it('matches the layout that the pure function gives for the same measurements', async () => {
    const { canvas, texts } = fakeCanvas();
    await createStoryBlob(story, () => canvas);
    const expected = layoutStory(story, (text) => text.length * 10).commands.filter(
      (c) => c.kind === 'text',
    );
    expect(texts.map((t) => t.text)).toEqual(
      expected.map((c) => (c.kind === 'text' ? c.text : '')),
    );
  });

  it('fails clearly when the browser gives no drawing context', async () => {
    const { canvas } = fakeCanvas({ context: false });
    await expect(createStoryBlob(story, () => canvas)).rejects.toThrow('2D canvas');
  });

  it('fails clearly when the browser cannot produce the image', async () => {
    const { canvas } = fakeCanvas({ blob: false });
    await expect(createStoryBlob(story, () => canvas)).rejects.toThrow('image');
  });
});
