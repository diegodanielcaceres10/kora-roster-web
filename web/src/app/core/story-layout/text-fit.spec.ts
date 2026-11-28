import { Measure } from './types';
import { tidy, truncate, wrapLines, wrapText } from './text-fit';

// Every character is 10 wide, whatever its size or weight, so widths are easy to read.
const measure: Measure = (text) => text.length * 10;

describe('tidy', () => {
  it('collapses every run of whitespace into one space and trims the ends', () => {
    expect(tidy('  a \t b\n\nc  ')).toBe('a b c');
  });

  it('turns blank text into an empty string', () => {
    expect(tidy(' \n ')).toBe('');
  });
});

describe('truncate', () => {
  it('keeps text that fits', () => {
    expect(truncate('hello world', 110, 20, 'normal', measure)).toBe('hello world');
  });

  it('cuts text that does not fit and ends it with an ellipsis inside the width', () => {
    expect(truncate('hello world', 80, 20, 'normal', measure)).toBe('hello w…');
  });

  it('drops the space before the ellipsis', () => {
    expect(truncate('hello world', 70, 20, 'normal', measure)).toBe('hello…');
  });

  it('gives only the ellipsis when nothing else fits', () => {
    expect(truncate('hello', 5, 20, 'normal', measure)).toBe('…');
  });

  it('gives only the ellipsis when there is no width at all', () => {
    expect(truncate('hello', 0, 20, 'normal', measure)).toBe('…');
    expect(truncate('hello', -10, 20, 'normal', measure)).toBe('…');
  });

  it('never cuts a character in half', () => {
    expect(truncate('🧤🧤🧤', 50, 20, 'normal', measure)).toBe('🧤🧤…');
  });

  it('passes the size and the weight to the measure', () => {
    const calls: [number, string][] = [];
    const spy: Measure = (text, size, weight) => {
      calls.push([size, weight]);
      return text.length * 10;
    };
    truncate('abc', 100, 24, 'bold', spy);
    expect(calls).toEqual([[24, 'bold']]);
  });
});

describe('wrapLines', () => {
  it('gives no lines for empty text', () => {
    expect(wrapLines('', 100, 20, 'normal', measure)).toEqual([]);
  });

  it('keeps one line when everything fits', () => {
    expect(wrapLines('one two', 100, 20, 'normal', measure)).toEqual(['one two']);
  });

  it('breaks between words when the next one does not fit', () => {
    expect(wrapLines('aaaa bbbb cccc', 100, 20, 'normal', measure)).toEqual(['aaaa bbbb', 'cccc']);
  });

  it('splits a word wider than the line by character', () => {
    expect(wrapLines('abcdefghijklmnop', 100, 20, 'normal', measure)).toEqual([
      'abcdefghij',
      'klmnop',
    ]);
  });

  it('closes the line before a word that has to be split', () => {
    expect(wrapLines('hi abcdefghijklmnop', 100, 20, 'normal', measure)).toEqual([
      'hi',
      'abcdefghij',
      'klmnop',
    ]);
  });
});

describe('wrapText', () => {
  it('tidies the text before wrapping it', () => {
    expect(wrapText('  aaaa   bbbb \n cccc ', 100, 20, 'normal', measure)).toEqual([
      'aaaa bbbb',
      'cccc',
    ]);
  });

  it('gives no lines for blank text', () => {
    expect(wrapText('   ', 100, 20, 'normal', measure)).toEqual([]);
  });
});
