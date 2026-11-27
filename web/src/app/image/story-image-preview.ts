import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { StoryInput } from '../core/story-layout';
import { STORY_BLOB } from './story-image';

// How long the input has to stay still before the image is generated again.
const IMAGE_PAUSE_MS = 300;

@Component({
  selector: 'app-story-image-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './story-image-preview.html',
})
export class StoryImagePreview {
  readonly storyInput = input.required<StoryInput>();
  readonly alt = input.required<string>();
  readonly loadingText = input.required<string>();
  readonly failedText = input.required<string>();

  private readonly createBlob = inject(STORY_BLOB);

  protected readonly imageUrl = signal<string | null>(null);
  protected readonly imageFailed = signal(false);

  private lastMade: StoryInput | null = null;
  private turn = 0;

  constructor() {
    effect((onCleanup) => {
      const current = this.storyInput();
      if (current === this.lastMade) return;
      const timer = setTimeout(() => void this.makeImage(current), IMAGE_PAUSE_MS);
      onCleanup(() => clearTimeout(timer));
    });
    inject(DestroyRef).onDestroy(() => {
      this.turn++;
      const url = this.imageUrl();
      if (url) URL.revokeObjectURL(url);
    });
  }

  private async makeImage(current: StoryInput): Promise<void> {
    const turn = ++this.turn;
    this.lastMade = current;
    this.imageFailed.set(false);
    try {
      const blob = await this.createBlob(current);
      // An older image that arrives after a newer one is not wanted.
      if (turn !== this.turn) return;
      const previous = this.imageUrl();
      this.imageUrl.set(URL.createObjectURL(blob));
      if (previous) URL.revokeObjectURL(previous);
    } catch {
      if (turn !== this.turn) return;
      this.lastMade = null;
      this.imageFailed.set(true);
    }
  }
}
