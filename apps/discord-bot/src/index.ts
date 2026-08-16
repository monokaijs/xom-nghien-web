import {
  Client,
  Events,
  GatewayIntentBits,
} from 'discord.js';
import { closeDatabase, recordActivity } from './activity-store.js';
import { config } from './config.js';
import { startHealthServer } from './health.js';
import { handleLinkCommand, linkCommand } from './link-command.js';
import { log } from './logger.js';
import { handleSupportCommand, supportCommand } from './support-command.js';
import { VoiceTracker } from './voice-tracker.js';
import { isMessageEligible } from './scoring.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
});
const healthServer = startHealthServer(client, config.healthPort);
let voiceTracker: VoiceTracker | null = null;
let stopping = false;

client.once(Events.ClientReady, async (readyClient) => {
  try {
    if (readyClient.application.id !== config.applicationId) {
      throw new Error('DISCORD_APPLICATION_ID does not match the authenticated bot');
    }
    const guild = await readyClient.guilds.fetch(config.guildId);
    await guild.commands.set([linkCommand, supportCommand]);
    voiceTracker = new VoiceTracker(guild, config.voiceCheckpointMs);
    await voiceTracker.start();
    log('info', 'discord_ready', { user: readyClient.user.tag, guildId: guild.id });
  } catch (error) {
    log('error', 'discord_initialization_failed', { error: String(error) });
    process.exitCode = 1;
    await shutdown();
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (!isMessageEligible({
    guildId: message.guildId,
    configuredGuildId: config.guildId,
    authorIsBot: message.author.bot,
    webhookId: message.webhookId,
  })) return;
  try {
    await recordActivity({
      guildId: config.guildId,
      discordUserId: message.author.id,
      channelId: message.channelId,
      activityType: 'message',
      sourceKey: message.id,
      occurredAt: message.createdAt,
      durationSeconds: 0,
      points: 1,
    });
  } catch (error) {
    log('error', 'message_award_failed', { messageId: message.id, error: String(error) });
  }
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  if ((oldState.guild.id === config.guildId || newState.guild.id === config.guildId) && voiceTracker) {
    voiceTracker.enqueue('voice_state_update');
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    if (interaction.commandName === linkCommand.name) {
      await handleLinkCommand(interaction);
    } else if (interaction.commandName === supportCommand.name) {
      await handleSupportCommand(interaction);
    }
  } catch (error) {
    log('error', 'command_failed', {
      commandName: interaction.commandName,
      discordUserId: interaction.user.id,
      error: String(error),
    });
    const response = { content: 'Không thể xử lý lệnh lúc này. Vui lòng thử lại.', flags: 64 as const };
    if (interaction.replied || interaction.deferred) await interaction.followUp(response);
    else await interaction.reply(response);
  }
});

client.on(Events.Error, (error) => log('error', 'discord_client_error', { error: String(error) }));

async function shutdown(): Promise<void> {
  if (stopping) return;
  stopping = true;
  log('info', 'shutdown_started');
  try {
    await voiceTracker?.stop();
    client.destroy();
    await new Promise<void>((resolve) => healthServer.close(() => resolve()));
    await closeDatabase();
  } catch (error) {
    log('error', 'shutdown_failed', { error: String(error) });
  }
}

process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());
process.on('unhandledRejection', (error) => log('error', 'unhandled_rejection', { error: String(error) }));

client.login(config.token).catch(async (error) => {
  log('error', 'discord_login_failed', { error: String(error) });
  process.exitCode = 1;
  await shutdown();
});
