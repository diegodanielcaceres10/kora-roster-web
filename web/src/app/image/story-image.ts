import { InjectionToken } from '@angular/core';
import {
  FontWeight,
  layoutStory,
  Measure,
  STORY_HEIGHT,
  STORY_WIDTH,
  StoryInput,
  StoryLayout,
} from '../core/story-layout';

// System fonts, with the emoji fonts of each platform as a fallback for the team icons
// and the goalkeeper glove.
export const STORY_FONT =
  'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, ' +
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

const fontOf = (size: number, weight: FontWeight) => `${weight} ${size}px ${STORY_FONT}`;

export function canvasMeasure(ctx: CanvasRenderingContext2D): Measure {
  return (text, size, weight) => {
    ctx.font = fontOf(size, weight);
    return ctx.measureText(text).width;
  };
}

// A rounded rectangle made of four arcs, which every browser draws the same way.
function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  { x, y, width, height, radius, fill }: Extract<StoryLayout['commands'][number], { kind: 'rect' }>,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  ctx.fill();
}

export function drawStory(ctx: CanvasRenderingContext2D, layout: StoryLayout): void {
  ctx.fillStyle = layout.background;
  ctx.fillRect(0, 0, layout.width, layout.height);
  ctx.textBaseline = 'middle';
  for (const command of layout.commands) {
    if (command.kind === 'rect') {
      fillRoundedRect(ctx, command);
    } else {
      ctx.font = fontOf(command.size, command.weight);
      ctx.fillStyle = command.color;
      ctx.textAlign = command.align;
      ctx.fillText(command.text, command.x, command.y);
    }
  }
}

export function createStoryBlob(
  input: StoryInput,
  createCanvas: () => HTMLCanvasElement = () => document.createElement('canvas'),
): Promise<Blob> {
  const canvas = createCanvas();
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('The 2D canvas is not available in this browser'));
  drawStory(ctx, layoutStory(input, canvasMeasure(ctx)));
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('The browser could not create the image')),
      'image/png',
    ),
  );
}

// A token so that screens and tests can replace how the image is made.
export const STORY_BLOB = new InjectionToken<(input: StoryInput) => Promise<Blob>>('STORY_BLOB', {
  providedIn: 'root',
  factory: () => (input) => createStoryBlob(input),
});
