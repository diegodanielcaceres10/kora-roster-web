import { Numbering } from '../core/format-teams';
import { StoryInput, StoryTeam } from '../core/story-layout';

export interface StoryInputOptions {
  teams: readonly StoryTeam[];
  location: string;
  footer: string;
  numbering: Numbering;
  confirmed: string;
  brand: string;
  theme: 'light' | 'dark';
}

/**
 * Builds the shared `StoryInput` payload used by both the preferences preview
 * and the downloaded/shared story image so both always include the same elements.
 */
export function buildStoryInput(options: StoryInputOptions): StoryInput {
  return {
    teams: options.teams,
    location: options.location,
    footer: options.footer,
    numbering: options.numbering,
    confirmed: options.confirmed,
    brand: options.brand,
    theme: options.theme,
  };
}
