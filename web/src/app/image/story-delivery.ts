import { InjectionToken } from '@angular/core';

// kora-roster-2026-11-07.png, with the date of the person and two digits for month and day.
export function storyFileName(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `kora-roster-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.png`;
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
