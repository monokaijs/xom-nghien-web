import { describe, expect, it } from 'vitest';
import { roundNumber } from './parser.js';

describe('demo parser round numbering', () => {
  it('converts total_rounds_played from zero-based to one-based numbering when no explicit round exists', () => {
    expect(roundNumber({ total_rounds_played: 0 })).toBe(1);
    expect(roundNumber({ total_rounds_played: 1 })).toBe(2);
    expect(roundNumber({ total_rounds_played: 12 })).toBe(13);
  });

  it('prefers explicit round fields over lagging total_rounds_played values', () => {
    expect(roundNumber({ round_number: 4 })).toBe(4);
    expect(roundNumber({ round: 7 })).toBe(7);
    expect(roundNumber({ total_rounds_played: 1, round: 1 })).toBe(1);
    expect(roundNumber({ total_rounds_played: 1, round: 2 })).toBe(2);
  });

  it('keeps synthetic pre-match round zero invalid so it can be discarded', () => {
    expect(roundNumber({ total_rounds_played: 0, round: 0 })).toBe(0);
  });
});
