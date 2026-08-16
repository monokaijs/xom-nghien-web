import { describe, expect, it } from 'vitest';
import { calculateVoiceAwards, isMessageEligible, isVoiceChannelEligible } from './scoring.js';

describe('message eligibility', () => {
  it('accepts only human non-webhook messages from the configured guild', () => {
    expect(isMessageEligible({ guildId: 'guild', configuredGuildId: 'guild', authorIsBot: false, webhookId: null })).toBe(true);
    expect(isMessageEligible({ guildId: 'other', configuredGuildId: 'guild', authorIsBot: false, webhookId: null })).toBe(false);
    expect(isMessageEligible({ guildId: 'guild', configuredGuildId: 'guild', authorIsBot: true, webhookId: null })).toBe(false);
    expect(isMessageEligible({ guildId: 'guild', configuredGuildId: 'guild', authorIsBot: false, webhookId: 'webhook' })).toBe(false);
  });
});

describe('voice eligibility', () => {
  it('requires two human non-deafened members', () => {
    expect(isVoiceChannelEligible([{ bot: false, selfDeaf: false }])).toBe(false);
    expect(isVoiceChannelEligible([
      { bot: false, selfDeaf: false },
      { bot: false, selfDeaf: false },
    ])).toBe(true);
    expect(isVoiceChannelEligible([
      { bot: false, selfDeaf: false },
      { bot: true, selfDeaf: false },
      { bot: false, selfDeaf: true },
    ])).toBe(false);
  });
});

describe('voice awards', () => {
  it('awards completed minutes and carries the remainder', () => {
    const start = new Date('2026-07-20T16:59:30.000Z');
    const result = calculateVoiceAwards({
      discordUserId: '123',
      eligibleSince: start,
      observedAt: new Date('2026-07-20T17:01:35.500Z'),
      remainderMs: 5_000,
    });
    expect(result.awards).toHaveLength(2);
    expect(result.awards[0].occurredAt.toISOString()).toBe('2026-07-20T17:00:25.000Z');
    expect(result.remainderMs).toBe(10_500);
  });

  it('creates deterministic keys when a settlement is retried', () => {
    const input = {
      discordUserId: '123',
      eligibleSince: new Date('2026-07-20T00:00:00.000Z'),
      observedAt: new Date('2026-07-20T00:05:00.000Z'),
      remainderMs: 0,
    };
    expect(calculateVoiceAwards(input)).toEqual(calculateVoiceAwards(input));
  });
});
