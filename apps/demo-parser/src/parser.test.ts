import { describe, expect, it } from 'vitest';
import { roundNumber } from './parser.js';

describe('demo parser round numbering', () => {
  it('converts total_rounds_played from zero-based to one-based numbering', () => {
    expect(roundNumber({ total_rounds_played: 0 })).toBe(1);
    expect(roundNumber({ total_rounds_played: 1 })).toBe(2);
    expect(roundNumber({ total_rounds_played: 12 })).toBe(13);
  });

  it('uses explicit round fields when total_rounds_played is unavailable', () => {
    expect(roundNumber({ round_number: 4 })).toBe(4);
    expect(roundNumber({ round: 7 })).toBe(7);
  });
});
