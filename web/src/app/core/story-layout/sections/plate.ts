import { PLATE_MARGIN, PLATE_RADIUS, PLATE_WIDTH } from '../metrics';
import { ThemeTokens } from '../theme';
import { RectCommand } from '../types';

export function plateCommand(theme: ThemeTokens, y: number, height: number): RectCommand {
  return {
    kind: 'rect',
    role: 'plate',
    x: PLATE_MARGIN,
    y,
    width: PLATE_WIDTH,
    height,
    radius: PLATE_RADIUS,
    fill: theme.plate.fill,
    stroke: { color: theme.plate.stroke, width: 2 },
  };
}
