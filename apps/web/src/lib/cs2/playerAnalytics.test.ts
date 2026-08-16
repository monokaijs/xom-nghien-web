import { describe, expect, it } from 'vitest';
import { buildPlayerAnalytics, type RawPlayerAnalysisEvent } from './playerAnalytics';

function event(overrides: Partial<RawPlayerAnalysisEvent>): RawPlayerAnalysisEvent {
  return {
    id: 1,
    mapnumber: 0,
    round_number: 1,
    tick: 100,
    event_type: 'weapon_fire',
    actor_steamid64: 'attacker',
    target_steamid64: null,
    weapon: 'weapon_ak47',
    value: null,
    payload: '{}',
    ...overrides,
  };
}

describe('buildPlayerAnalytics', () => {
  it('aggregates shots, enemy damage, hitgroups, kills and deaths per weapon', () => {
    const analytics = buildPlayerAnalytics([
      event({ id: 1 }),
      event({ id: 2, tick: 101 }),
      event({
        id: 3,
        event_type: 'player_hurt',
        target_steamid64: 'victim',
        value: 42,
        payload: JSON.stringify({ hitgroup: 'head', attacker_team_num: 3, user_team_num: 2 }),
      }),
      event({
        id: 4,
        event_type: 'player_death',
        target_steamid64: 'victim',
        payload: JSON.stringify({ headshot: true, distance: 24.5, attacker_team_num: 3, user_team_num: 2 }),
      }),
    ]);

    expect(analytics.attacker.totals).toEqual({ kills: 1, shots: 2, hits: 1, damage: 42 });
    expect(analytics.attacker.weapons[0]).toMatchObject({
      weapon: 'ak47',
      kills: 1,
      shots: 2,
      hits: 1,
      damage: 42,
      headHits: 1,
      averageKillDistance: 24.5,
    });
    expect(analytics.attacker.hitRegions).toEqual([{ region: 'head', hits: 1, damage: 42 }]);
    expect(analytics.victim.deaths).toHaveLength(1);
  });

  it('ignores suicides and friendly damage', () => {
    const analytics = buildPlayerAnalytics([
      event({
        event_type: 'player_hurt',
        target_steamid64: 'teammate',
        value: 50,
        payload: JSON.stringify({ hitgroup: 'chest', attacker_team_num: 3, user_team_num: 3 }),
      }),
      event({ event_type: 'player_death', target_steamid64: 'attacker' }),
    ]);

    expect(analytics).toEqual({});
  });
});
