import { describe, expect, it } from 'vitest';
import { getLeaderboardWindow, normalizeLeaderboardPeriod } from './community-leaderboard-period';

describe('community leaderboard periods', () => {
  it('uses Monday midnight in Bangkok for weekly rankings', () => {
    const window = getLeaderboardWindow('week', new Date('2026-07-21T12:00:00.000Z'));
    expect(window.startsAt?.toISOString()).toBe('2026-07-19T17:00:00.000Z');
    expect(window.endsAt?.toISOString()).toBe('2026-07-26T17:00:00.000Z');
  });

  it('uses Bangkok calendar months', () => {
    const window = getLeaderboardWindow('month', new Date('2026-07-31T20:00:00.000Z'));
    expect(window.startsAt?.toISOString()).toBe('2026-07-31T17:00:00.000Z');
    expect(window.endsAt?.toISOString()).toBe('2026-08-31T17:00:00.000Z');
  });

  it('keeps the legacy default all-time', () => {
    expect(normalizeLeaderboardPeriod(undefined)).toBe('all');
    expect(getLeaderboardWindow('all').startsAt).toBeNull();
  });
});
