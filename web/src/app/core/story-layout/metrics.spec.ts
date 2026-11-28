import { fitSlot, gapOf, MAX_SLOT, MIN_SLOT } from './metrics';

describe('gapOf', () => {
  it('grows with the slot', () => {
    expect([gapOf(48), gapOf(60), gapOf(72)]).toEqual([8, 9, 11]);
  });

  it('stays between 8 and 12', () => {
    expect(gapOf(10)).toBe(8);
    expect(gapOf(100)).toBe(12);
  });
});

describe('fitSlot', () => {
  it('takes the tallest slot when every row fits in it', () => {
    expect(fitSlot(100, 1)).toBe(MAX_SLOT);
    expect(fitSlot(404, 5)).toBe(MAX_SLOT);
  });

  it('takes a shorter slot when the area is tighter', () => {
    expect(fitSlot(403, 5)).toBe(71);
  });

  it('never goes under the shortest slot', () => {
    expect(fitSlot(0, 10)).toBe(MIN_SLOT);
  });
});
