import { and, db, discordVoiceState, eq, sql } from '@xom/db';
import type { Guild } from 'discord.js';
import { settleVoiceUser } from './activity-store.js';
import { log } from './logger.js';
import { isVoiceChannelEligible } from './scoring.js';

interface CurrentVoiceMember {
  discordUserId: string;
  channelId: string;
  selfDeaf: boolean;
}

export class VoiceTracker {
  private queue: Promise<void> = Promise.resolve();
  private checkpoint: NodeJS.Timeout | null = null;

  constructor(
    private readonly guild: Guild,
    private readonly checkpointMs: number,
  ) {}

  async start(): Promise<void> {
    const now = new Date();
    await db.update(discordVoiceState)
      .set({ channelId: null, connectedAt: null, eligibleSince: null, lastObservedAt: now })
      .where(eq(discordVoiceState.guildId, this.guild.id));
    await this.syncCurrent(now);
    this.checkpoint = setInterval(() => this.enqueue('checkpoint'), this.checkpointMs);
    this.checkpoint.unref();
  }

  enqueue(reason: string): void {
    this.queue = this.queue
      .then(() => this.settleAndSync(new Date()))
      .catch((error) => log('error', 'voice_sync_failed', { reason, error: String(error) }));
  }

  async stop(): Promise<void> {
    if (this.checkpoint) clearInterval(this.checkpoint);
    await this.queue;
    await this.settleAll(new Date());
  }

  private async settleAndSync(now: Date): Promise<void> {
    await this.settleAll(now);
    await this.syncCurrent(now);
  }

  private async settleAll(now: Date): Promise<void> {
    const activeStates = await db.select({ discordUserId: discordVoiceState.discordUserId })
      .from(discordVoiceState)
      .where(and(
        eq(discordVoiceState.guildId, this.guild.id),
        sql`${discordVoiceState.channelId} IS NOT NULL`,
      ));
    for (const state of activeStates) {
      await settleVoiceUser(this.guild.id, state.discordUserId, now);
    }
  }

  private currentMembers(): CurrentVoiceMember[] {
    return [...this.guild.voiceStates.cache.values()]
      .filter((state) => state.channelId && state.member && !state.member.user.bot)
      .map((state) => ({
        discordUserId: state.id,
        channelId: state.channelId!,
        selfDeaf: Boolean(state.selfDeaf),
      }));
  }

  private async syncCurrent(now: Date): Promise<void> {
    const current = this.currentMembers();
    const currentIds = new Set(current.map((member) => member.discordUserId));
    const existing = await db.select().from(discordVoiceState)
      .where(eq(discordVoiceState.guildId, this.guild.id));
    const existingByUser = new Map(existing.map((state) => [state.discordUserId, state]));
    const byChannel = new Map<string, CurrentVoiceMember[]>();
    for (const member of current) {
      const members = byChannel.get(member.channelId) || [];
      members.push(member);
      byChannel.set(member.channelId, members);
    }

    for (const member of current) {
      const previous = existingByUser.get(member.discordUserId);
      const channelMembers = byChannel.get(member.channelId) || [];
      const channelEligible = member.channelId !== this.guild.afkChannelId
        && isVoiceChannelEligible(channelMembers.map((entry) => ({ bot: false, selfDeaf: entry.selfDeaf })));
      const eligible = channelEligible && !member.selfDeaf;
      const connectedAt = previous?.channelId === member.channelId && previous.connectedAt
        ? previous.connectedAt
        : now;

      await db.insert(discordVoiceState).values({
        guildId: this.guild.id,
        discordUserId: member.discordUserId,
        channelId: member.channelId,
        connectedAt,
        eligibleSince: eligible ? now : null,
        remainderMs: previous?.remainderMs || 0,
        lastObservedAt: now,
      }).onDuplicateKeyUpdate({
        set: {
          channelId: member.channelId,
          connectedAt,
          eligibleSince: eligible ? now : null,
          lastObservedAt: now,
        },
      });
    }

    for (const state of existing) {
      if (state.channelId && !currentIds.has(state.discordUserId)) {
        await db.update(discordVoiceState)
          .set({ channelId: null, connectedAt: null, eligibleSince: null, lastObservedAt: now })
          .where(and(
            eq(discordVoiceState.guildId, this.guild.id),
            eq(discordVoiceState.discordUserId, state.discordUserId),
          ));
      }
    }
  }
}
