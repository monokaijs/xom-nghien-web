import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  MessageFlags,
} from 'discord.js';
import { config } from './config.js';

export const supportCommand = {
  name: 'support',
  description: 'Hỗ trợ, quyền riêng tư và điều khoản của Xóm Nghiện',
};

export async function handleSupportCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel('Hỗ trợ')
      .setURL(`${config.webPublicUrl}/support`),
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel('Quyền riêng tư')
      .setURL(`${config.webPublicUrl}/privacy`),
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel('Điều khoản')
      .setURL(`${config.webPublicUrl}/terms`),
  );

  await interaction.reply({
    content: 'Chọn tài liệu hoặc kênh hỗ trợ bạn cần.',
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
}
