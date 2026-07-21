import { mysqlTable, bigint, int, varchar, float, tinyint, text, timestamp, index, unique, datetime, primaryKey } from 'drizzle-orm/mysql-core';


export const matchzyStatsMatches = mysqlTable('matchzy_stats_matches', {
  matchid: int('matchid').primaryKey().autoincrement(),
  start_time: datetime('start_time').notNull(),
  end_time: datetime('end_time'),
  winner: varchar('winner', { length: 255 }).notNull().default(''),
  series_type: varchar('series_type', { length: 255 }).notNull().default(''),
  team1_name: varchar('team1_name', { length: 255 }).notNull().default(''),
  team1_score: int('team1_score').notNull().default(0),
  team2_name: varchar('team2_name', { length: 255 }).notNull().default(''),
  team2_score: int('team2_score').notNull().default(0),
  server_ip: varchar('server_ip', { length: 255 }).notNull().default('0'),
});

export const matchzyStatsMaps = mysqlTable('matchzy_stats_maps', {
  matchid: int('matchid').notNull(),
  mapnumber: tinyint('mapnumber').notNull(),
  start_time: datetime('start_time').notNull(),
  end_time: datetime('end_time'),
  winner: varchar('winner', { length: 16 }).notNull().default(''),
  mapname: varchar('mapname', { length: 64 }).notNull().default(''),
  team1_score: int('team1_score').notNull().default(0),
  team2_score: int('team2_score').notNull().default(0),
}, (table) => ({
  pk: primaryKey({ columns: [table.matchid, table.mapnumber] }),
  idxMapnumber: index('mapnumber_index').on(table.mapnumber),
}));

export const matchzyStatsPlayers = mysqlTable('matchzy_stats_players', {
  matchid: int('matchid').notNull(),
  mapnumber: tinyint('mapnumber').notNull(),
  steamid64: varchar('steamid64', { length: 64 }).notNull(),
  team: varchar('team', { length: 255 }).notNull().default(''),
  name: varchar('name', { length: 255 }).notNull(),
  kills: int('kills').notNull(),
  deaths: int('deaths').notNull(),
  damage: int('damage').notNull(),
  assists: int('assists').notNull(),
  enemy5ks: int('enemy5ks').notNull(),
  enemy4ks: int('enemy4ks').notNull(),
  enemy3ks: int('enemy3ks').notNull(),
  enemy2ks: int('enemy2ks').notNull(),
  utility_count: int('utility_count').notNull(),
  utility_damage: int('utility_damage').notNull(),
  utility_successes: int('utility_successes').notNull(),
  utility_enemies: int('utility_enemies').notNull(),
  flash_count: int('flash_count').notNull(),
  flash_successes: int('flash_successes').notNull(),
  health_points_removed_total: int('health_points_removed_total').notNull(),
  health_points_dealt_total: int('health_points_dealt_total').notNull(),
  shots_fired_total: int('shots_fired_total').notNull(),
  shots_on_target_total: int('shots_on_target_total').notNull(),
  v1_count: int('v1_count').notNull(),
  v1_wins: int('v1_wins').notNull(),
  v2_count: int('v2_count').notNull(),
  v2_wins: int('v2_wins').notNull(),
  entry_count: int('entry_count').notNull(),
  entry_wins: int('entry_wins').notNull(),
  equipment_value: int('equipment_value').notNull(),
  money_saved: int('money_saved').notNull(),
  kill_reward: int('kill_reward').notNull(),
  live_time: int('live_time').notNull(),
  head_shot_kills: int('head_shot_kills').notNull(),
  cash_earned: int('cash_earned').notNull(),
  enemies_flashed: int('enemies_flashed').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.matchid, table.mapnumber, table.steamid64] }),
}));

export const matchzyDemos = mysqlTable('matchzy_demos', {
  id: int('id').primaryKey().autoincrement(),
  matchid: int('matchid').notNull(),
  mapnumber: tinyint('mapnumber').notNull(),
  roundnumber: int('roundnumber').notNull().default(0),
  file_name: varchar('file_name', { length: 255 }).notNull(),
  storage_key: varchar('storage_key', { length: 512 }).notNull(),
  file_size: int('file_size', { unsigned: true }).notNull(),
  sha256: varchar('sha256', { length: 64 }).notNull(),
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull(),
}, (table) => ({
  uniqueMatchMap: unique('uq_matchzy_demos_match_map').on(table.matchid, table.mapnumber),
  idxMatch: index('idx_matchzy_demos_match').on(table.matchid),
}));

export const userInfo = mysqlTable('user_info', {
  steamid64: varchar('steamid64', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  avatar: varchar('avatar', { length: 512 }),
  avatarmedium: varchar('avatarmedium', { length: 512 }),
  avatarfull: varchar('avatarfull', { length: 512 }),
  profileurl: varchar('profileurl', { length: 512 }),
  facebook: varchar('facebook', { length: 512 }),
  spotify: varchar('spotify', { length: 512 }),
  twitter: varchar('twitter', { length: 512 }),
  instagram: varchar('instagram', { length: 512 }),
  github: varchar('github', { length: 512 }),
  google_id: varchar('google_id', { length: 255 }),
  discord_id: varchar('discord_id', { length: 255 }),
  github_oauth_id: varchar('github_oauth_id', { length: 255 }),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  banned: tinyint('banned').notNull().default(0),
  last_updated: timestamp('last_updated').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  idxLastUpdated: index('idx_last_updated').on(table.last_updated),
  idxGoogleId: index('idx_google_id').on(table.google_id),
  idxDiscordId: index('idx_discord_id').on(table.discord_id),
  uniqueDiscordId: unique('uq_user_info_discord_id').on(table.discord_id),
  idxGithubOauthId: index('idx_github_oauth_id').on(table.github_oauth_id),
}));

export const userPoints = mysqlTable('user_points', {
  userId: varchar('user_id', { length: 64 })
    .primaryKey()
    .references(() => userInfo.steamid64, { onDelete: 'cascade' }),
  points: int('points').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  idxPointsRanking: index('idx_user_points_ranking').on(table.points, table.userId),
}));

export const discordActivityEvents = mysqlTable('discord_activity_events', {
  id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
  guildId: varchar('guild_id', { length: 32 }).notNull(),
  discordUserId: varchar('discord_user_id', { length: 32 }).notNull(),
  channelId: varchar('channel_id', { length: 32 }).notNull(),
  activityType: varchar('activity_type', { length: 16 }).notNull(),
  sourceKey: varchar('source_key', { length: 128 }).notNull(),
  occurredAt: datetime('occurred_at', { mode: 'date', fsp: 3 }).notNull(),
  durationSeconds: int('duration_seconds', { unsigned: true }).notNull().default(0),
  points: int('points', { unsigned: true }).notNull(),
  creditedUserId: varchar('credited_user_id', { length: 64 })
    .references(() => userInfo.steamid64, { onDelete: 'set null' }),
  creditedAt: datetime('credited_at', { mode: 'date', fsp: 3 }),
  createdAt: timestamp('created_at', { fsp: 3 }).defaultNow().notNull(),
}, (table) => ({
  uniqueSource: unique('uq_discord_activity_source').on(table.guildId, table.activityType, table.sourceKey),
  idxDiscordUncredited: index('idx_discord_activity_uncredited').on(table.discordUserId, table.creditedUserId),
  idxUserPeriod: index('idx_discord_activity_user_period').on(table.creditedUserId, table.occurredAt),
}));

export const discordVoiceState = mysqlTable('discord_voice_state', {
  guildId: varchar('guild_id', { length: 32 }).notNull(),
  discordUserId: varchar('discord_user_id', { length: 32 }).notNull(),
  channelId: varchar('channel_id', { length: 32 }),
  connectedAt: datetime('connected_at', { mode: 'date', fsp: 3 }),
  eligibleSince: datetime('eligible_since', { mode: 'date', fsp: 3 }),
  remainderMs: int('remainder_ms', { unsigned: true }).notNull().default(0),
  lastObservedAt: datetime('last_observed_at', { mode: 'date', fsp: 3 }).notNull(),
  updatedAt: timestamp('updated_at', { fsp: 3 }).defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.guildId, table.discordUserId] }),
  idxActiveChannel: index('idx_discord_voice_active_channel').on(table.guildId, table.channelId),
}));

export const discordLinkTokens = mysqlTable('discord_link_tokens', {
  tokenHash: varchar('token_hash', { length: 64 }).primaryKey(),
  guildId: varchar('guild_id', { length: 32 }).notNull(),
  discordUserId: varchar('discord_user_id', { length: 32 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 512 }),
  expiresAt: datetime('expires_at', { mode: 'date', fsp: 3 }).notNull(),
  usedAt: datetime('used_at', { mode: 'date', fsp: 3 }),
  createdAt: timestamp('created_at', { fsp: 3 }).defaultNow().notNull(),
}, (table) => ({
  idxDiscordExpiry: index('idx_discord_link_user_expiry').on(table.discordUserId, table.expiresAt),
}));

export const servers = mysqlTable('servers', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  game: varchar('game', { length: 50 }).notNull(),
  address: varchar('address', { length: 255 }),
  connectionGuide: text('connection_guide'),
  description: text('description'),
  metadataUrl: varchar('metadata_url', { length: 2048 }),
  rcon_password: varchar('rcon_password', { length: 255 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  idxGame: index('idx_game').on(table.game),
  uniqueAddress: unique('unique_address').on(table.address),
}));

export type MatchzyStatsMatch = typeof matchzyStatsMatches.$inferSelect;
export type MatchzyStatsMap = typeof matchzyStatsMaps.$inferSelect;
export type MatchzyStatsPlayer = typeof matchzyStatsPlayers.$inferSelect;
export type MatchzyDemo = typeof matchzyDemos.$inferSelect;
export type UserInfo = typeof userInfo.$inferSelect;
export type NewUserInfo = typeof userInfo.$inferInsert;
export type UserPoints = typeof userPoints.$inferSelect;
export type NewUserPoints = typeof userPoints.$inferInsert;
export type DiscordActivityEvent = typeof discordActivityEvents.$inferSelect;
export type NewDiscordActivityEvent = typeof discordActivityEvents.$inferInsert;
export type DiscordVoiceState = typeof discordVoiceState.$inferSelect;
export type NewDiscordVoiceState = typeof discordVoiceState.$inferInsert;
export type DiscordLinkToken = typeof discordLinkTokens.$inferSelect;
export type NewDiscordLinkToken = typeof discordLinkTokens.$inferInsert;
export type Server = typeof servers.$inferSelect;
export type NewServer = typeof servers.$inferInsert;
