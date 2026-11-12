import { DICTIONARIES } from '../../i18n/dictionaries';
import { countStatus } from './count-status';

const { status } = DICTIONARIES.es.tool.preview;

describe('countStatus', () => {
  it.each([
    [0, 2, status.tooFew(10, 10)],
    [9, 2, status.tooFew(1, 10)],
    [23, 2, status.tooMany(1, 22)],
    [11, 2, status.uneven(11, 2)],
    [12, 2, status.ok],
    [16, 3, status.uneven(16, 3)],
    [15, 3, status.ok],
  ])('says what %i players need for %i teams', (count, teams, expected) => {
    expect(countStatus(status, count, teams)).toBe(expected);
  });

  it('says it in the language of the texts it is given', () => {
    expect(countStatus(DICTIONARIES.en.tool.preview.status, 11, 2)).toBe(
      DICTIONARIES.en.tool.preview.status.uneven(11, 2),
    );
  });
});
