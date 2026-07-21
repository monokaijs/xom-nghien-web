import { createHash, randomBytes } from 'node:crypto';
import { db, discordLinkTokens, lt } from '@xom/db';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  MessageFlags,
} from 'discord.js';
import { config } from './config.js';

export const linkCommand = {
  name: 'link',
  description: 'Kết nối tài khoản Discord với tài khoản Xóm Nghiện',
};

export async function handleLinkCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (interaction.guildId !== config.guildId) {
    await interaction.reply({ content: 'Lệnh này chỉ dùng trong máy chủ Xóm Nghiện.', flags: MessageFlags.Ephemeral });
    return;
  }

  await db.delete(discordLinkTokens).where(lt(discordLinkTokens.expiresAt, new Date()));

  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  await db.insert(discordLinkTokens).values({
    tokenHash,
    guildId: config.guildId,
    discordUserId: interaction.user.id,
    displayName: interaction.user.globalName || interaction.user.username,
    avatarUrl: interaction.user.displayAvatarURL({ size: 128 }),
    expiresAt: new Date(Date.now() + config.linkTtlMs),
  });

  const linkUrl = `${config.webPublicUrl}/connect/discord?token=${encodeURIComponent(rawToken)}`;
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Kết nối tài khoản').setURL(linkUrl),
  );
  await interaction.reply({
    content: 'Liên kết này chỉ dành cho bạn và sẽ hết hạn sau 10 phút.',
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
}
