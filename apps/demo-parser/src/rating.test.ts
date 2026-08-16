import { describe, expect, it } from 'vitest';
import { calculateRatingChange, expectedScore, isRatedServer } from './rating.js';

describe('XN rating', () => {
  it('gives evenly matched teams a 50% expectation', () => {
    expect(expectedScore(1_000, 1_000)).toBeCloseTo(0.5);
  });

  it('uses a larger placement adjustment and bounded round margin', () => {
    const placement = calculateRatingChange({
      rating: 1_000,
      matchesPlayed: 0,
      opponentTeamRating: 1_000,
      result: 1,
      scoreFor: 13,
      scoreAgainst: 0,
    });
    const established = calculateRatingChange({
      rating: 1_000,
      matchesPlayed: 20,
      opponentTeamRating: 1_000,
      result: 1,
      scoreFor: 13,
      scoreAgainst: 0,
    });

    expect(placement.delta).toBe(28);
    expect(established.delta).toBe(18);
  });

  it('matches exact hosts and host-only allowlist entries', () => {
    expect(isRatedServer('10.0.0.8:27015', ['10.0.0.8'])).toBe(true);
    expect(isRatedServer('cs2.example.com:27015', ['cs2.example.com:27015'])).toBe(true);
    expect(isRatedServer('10.0.0.9:27015', ['10.0.0.8'])).toBe(false);
  });
});
