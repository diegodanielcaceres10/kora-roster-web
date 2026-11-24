import { InjectionToken } from '@angular/core';

// kora-roster-2026-11-07-14-35-52.png: the date and the time of the person (24 hours), with two
// digits for every part but the year. The seconds keep two images made in the same minute apart.
export function storyFileName(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())];
  const time = [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())];
  return `kora-roster-${[...day, ...time].join('-')}.png`;
}

const fileOf = (blob: Blob, name: string) => new File([blob], name, { type: 'image/png' });

export function canShareStory(blob: Blob, name: string): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [fileOf(blob, name)] })
  );
}

// Closing the sharing panel is not a failure, so it is reported apart from the errors.
export async function shareStory(blob: Blob, name: string): Promise<'shared' | 'cancelled'> {
  try {
    await navigator.share({ files: [fileOf(blob, name)] });
    return 'shared';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    throw error;
  }
}

export function downloadStory(url: string, name: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export interface StoryDelivery {
  canShare(blob: Blob, name: string): boolean;
  share(blob: Blob, name: string): Promise<'shared' | 'cancelled'>;
  download(url: string, name: string): void;
}

// A token so that screens and tests can replace how the image leaves the app.
export const STORY_DELIVERY = new InjectionToken<StoryDelivery>('STORY_DELIVERY', {
  providedIn: 'root',
  factory: () => ({ canShare: canShareStory, share: shareStory, download: downloadStory }),
});
