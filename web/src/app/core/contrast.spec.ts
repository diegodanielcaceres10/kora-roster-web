import { contrastRatio, readableTextColor } from './contrast';

describe('contrastRatio', () => {
  it('is 21 between black and white, in either order', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  it('is 1 between a color and itself', () => {
    expect(contrastRatio('#e53935', '#e53935')).toBeCloseTo(1, 5);
  });

  it('reads upper and lower case the same', () => {
    expect(contrastRatio('#AABBCC', '#112233')).toBeCloseTo(contrastRatio('#aabbcc', '#112233'), 8);
  });

  it('gives the known value for a mid gray against white', () => {
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 1);
  });
});

describe('readableTextColor', () => {
  it.each([
    ['#000000', '#ffffff'],
    ['#1b2a41', '#ffffff'],
    ['#00008b', '#ffffff'],
    ['#8e24aa', '#ffffff'],
    ['#ffffff', '#111111'],
    ['#fdd835', '#111111'],
    ['#ffff00', '#111111'],
    ['#fb8c00', '#111111'],
  ])('on %s the text is %s', (background, text) => {
    expect(readableTextColor(background)).toBe(text);
  });

  it('always picks the one with more contrast, for any color', () => {
    let seed = 12345;
    const next = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed % 256;
    };
    for (let i = 0; i < 300; i++) {
      const hex = `#${[next(), next(), next()].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
      const chosen = readableTextColor(hex);
      const other = chosen === '#ffffff' ? '#111111' : '#ffffff';
      expect(contrastRatio(hex, chosen), hex).toBeGreaterThanOrEqual(contrastRatio(hex, other));
    }
  });

  it('is white for something that is not a hex color', () => {
    expect(readableTextColor('red')).toBe('#ffffff');
    expect(readableTextColor('#xyz')).toBe('#ffffff');
    expect(readableTextColor('')).toBe('#ffffff');
  });
});
