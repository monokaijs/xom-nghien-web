export interface VoiceParticipant {
  bot: boolean;
  selfDeaf: boolean;
}

export function isMessageEligible(input: {
  guildId: string | null;
  configuredGuildId: string;
  authorIsBot: boolean;
  webhookId: string | null;
}): boolean {
  return input.guildId === input.configuredGuildId && !input.authorIsBot && !input.webhookId;
}

export function isVoiceChannelEligible(participants: VoiceParticipant[]): boolean {
  return participants.filter((participant) => !participant.bot && !participant.selfDeaf).length >= 2;
}

export interface VoiceAward {
  sourceKey: string;
  occurredAt: Date;
}

export function calculateVoiceAwards(input: {
  discordUserId: string;
  eligibleSince: Date;
  observedAt: Date;
  remainderMs: number;
}): { awards: VoiceAward[]; remainderMs: number } {
  const elapsedMs = Math.max(0, input.observedAt.getTime() - input.eligibleSince.getTime());
  const safeRemainder = Math.min(59_999, Math.max(0, Math.trunc(input.remainderMs)));
  const totalMs = safeRemainder + elapsedMs;
  const pointCount = Math.floor(totalMs / 60_000);
  const firstCompletionOffset = 60_000 - safeRemainder;
  const awards = Array.from({ length: pointCount }, (_, index) => {
    const occurredAt = new Date(input.eligibleSince.getTime() + firstCompletionOffset + index * 60_000);
    return {
      occurredAt,
      sourceKey: `voice:${input.discordUserId}:${input.eligibleSince.getTime()}:${index}`,
    };
  });

  return { awards, remainderMs: totalMs % 60_000 };
}
