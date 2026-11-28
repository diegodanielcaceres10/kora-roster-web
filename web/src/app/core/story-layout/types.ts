import { Numbering } from '../format-teams';

export type FontWeight = 'normal' | 'bold';
export type Measure = (text: string, size: number, weight: FontWeight) => number;

export interface StoryPlayer {
  name: string;
  isGoalkeeper: boolean;
}

export interface StoryTeam {
  title: string;
  color: string;
  players: readonly StoryPlayer[];
}

export interface StoryInput {
  teams: readonly StoryTeam[];
  // Optional message header shown above the location and teams.
  header?: string;
  // Where the pitch is. It gets a card of its own under the top row, wrapping without ellipsis.
  location: string;
  footer: string;
  numbering: Numbering;
  confirmed: string;
  brand: string;
  theme?: 'light' | 'dark';
}

export type RectRole =
  | 'plate'
  | 'brand-pill'
  | 'status-pill'
  | 'panel'
  | 'title-bar'
  | 'highlight'
  | 'matchday-card'
  | 'header-card'
  | 'location-card'
  | 'player-row'
  | 'badge';

export type TextRole =
  | 'brand-pill'
  | 'status-pill'
  | 'header'
  | 'location'
  | 'footer'
  | 'brand'
  | 'wordmark'
  | 'title'
  | 'player'
  | 'matchday'
  | 'badge';

export interface RectCommand {
  kind: 'rect';
  role: RectRole;
  team?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  fill: string;
  stroke?: { color: string; width: number };
}

export interface TextCommand {
  kind: 'text';
  role: TextRole;
  team?: number;
  x: number;
  y: number;
  text: string;
  size: number;
  weight: FontWeight;
  color: string;
  align: 'left' | 'center' | 'right';
}

// The mark of Kora. The picture itself is not part of the layout: whoever draws it brings it.
export interface ImageCommand {
  kind: 'image';
  role: 'logo';
  x: number;
  y: number;
  width: number;
  height: number;
}

export type StoryCommand = RectCommand | TextCommand | ImageCommand;

export interface StoryLayout {
  width: number;
  height: number;
  background: string;
  commands: StoryCommand[];
}
