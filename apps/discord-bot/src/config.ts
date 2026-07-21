function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function publicUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('WEB_PUBLIC_URL must use http or https');
  }
  return url.toString().replace(/\/$/, '');
}

export const config = {
  token: required('DISCORD_BOT_TOKEN'),
  applicationId: required('DISCORD_APPLICATION_ID'),
  guildId: required('DISCORD_GUILD_ID'),
  webPublicUrl: publicUrl(required('WEB_PUBLIC_URL')),
  healthPort: Number.parseInt(process.env.DISCORD_BOT_HEALTH_PORT || '3100', 10),
  linkTtlMs: 10 * 60 * 1000,
  voiceCheckpointMs: 5 * 60 * 1000,
};
