import { StoryInput } from './types';

export interface ThemeTokens {
  bg: string;
  plate: { fill: string; stroke: string };
  brandPill: { fill: string; stroke: string; text: string };
  wordmark: string;
  statusPill: { fill: string; text: string };
  infoCard: { fill: string; stroke: string; text: string; icon: string };
  matchdayCard: { fill: string; stroke: string; label: string; text: string };
  vsBadge: { fill: string; border: string; text: string; subtext: string };
  teamPanel: { fill: string; stroke: string; title: string; count: string };
  playerRow: { fill: string; stroke: string; num: string; text: string };
  gkRow: { fill: string; stroke: string };
  gkBadge: { fill: string; text: string };
  footer: string;
}

const DARK_THEME: ThemeTokens = {
  bg: '#0a0d12',
  plate: { fill: '#10141b', stroke: '#1f2633' },
  brandPill: { fill: '#1a1811', stroke: '#f59e0b40', text: '#f59e0b' },
  wordmark: '#f8fafc',
  statusPill: { fill: '#f59e0b', text: '#0a0d12' },
  infoCard: { fill: '#161b24', stroke: '#242c3b', text: '#e2e8f0', icon: '#f59e0b' },
  matchdayCard: { fill: '#161b24', stroke: '#242c3b', label: '#94a3b8', text: '#ffffff' },
  vsBadge: { fill: '#0a0d12', border: '#f59e0b60', text: '#f59e0b', subtext: '#94a3b8' },
  teamPanel: { fill: '#13171f', stroke: '#222938', title: '#f8fafc', count: '#94a3b8' },
  playerRow: { fill: '#1a202c', stroke: '#252d3d', num: '#64748b', text: '#f8fafc' },
  gkRow: { fill: '#242116', stroke: '#f59e0b50' },
  gkBadge: { fill: '#f59e0b', text: '#0a0d12' },
  footer: '#64748b',
};

const LIGHT_THEME: ThemeTokens = {
  bg: '#eef2f7',
  plate: { fill: '#ffffff', stroke: '#e2e8f0' },
  brandPill: { fill: '#fff8e6', stroke: '#fde68a', text: '#b45309' },
  wordmark: '#0f172a',
  statusPill: { fill: '#f59e0b', text: '#ffffff' },
  infoCard: { fill: '#f8fafc', stroke: '#e2e8f0', text: '#1e293b', icon: '#b45309' },
  matchdayCard: { fill: '#f8fafc', stroke: '#e2e8f0', label: '#64748b', text: '#0f172a' },
  vsBadge: { fill: '#0f172a', border: '#f59e0b60', text: '#f59e0b', subtext: '#94a3b8' },
  teamPanel: { fill: '#ffffff', stroke: '#e2e8f0', title: '#0f172a', count: '#64748b' },
  playerRow: { fill: '#f8fafc', stroke: '#f1f5f9', num: '#94a3b8', text: '#0f172a' },
  gkRow: { fill: '#fffbeb', stroke: '#fde68a' },
  gkBadge: { fill: '#f59e0b', text: '#ffffff' },
  footer: '#64748b',
};

// Light unless the story asks for dark.
export function themeFor(theme: StoryInput['theme']): ThemeTokens {
  return theme === 'dark' ? DARK_THEME : LIGHT_THEME;
}
