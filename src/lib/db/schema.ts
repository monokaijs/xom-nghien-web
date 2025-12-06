import { mysqlTable, int, varchar, float, tinyint, text, timestamp, index, unique, datetime, primaryKey, json } from 'drizzle-orm/mysql-core';


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
  idxGithubOauthId: index('idx_github_oauth_id').on(table.github_oauth_id),
}));

export const servers = mysqlTable('servers', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  game: varchar('game', { length: 50 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  description: text('description'),
  rcon_password: varchar('rcon_password', { length: 255 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  idxGame: index('idx_game').on(table.game),
  uniqueAddress: unique('unique_address').on(table.address),
}));

export const tournaments = mysqlTable('cs2_tournaments', {
  id: int('id').primaryKey().autoincrement(),
  team1_name: varchar('team1_name', { length: 255 }).notNull(),
  team2_name: varchar('team2_name', { length: 255 }).notNull(),
  num_maps: tinyint('num_maps').notNull(),
  maplist: json('maplist').$type<string[]>().notNull(),
  clinch_series: tinyint('clinch_series').notNull().default(1),
  players_per_team: tinyint('players_per_team').notNull().default(5),
  cvars: json('cvars').$type<Record<string, string>>(),
  registration_deadline: timestamp('registration_deadline'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const tournamentPlayers = mysqlTable('cs2_tournament_players', {
  id: int('id').primaryKey().autoincrement(),
  tournament_id: int('tournament_id').notNull(),
  team_number: tinyint('team_number').notNull(),
  steamid64: varchar('steamid64', { length: 64 }).notNull(),
  player_name: varchar('player_name', { length: 255 }).notNull(),
}, (table) => ({
  idxTournamentId: index('idx_tournament_id').on(table.tournament_id),
  uniquePlayerPerTournament: unique('unique_player_per_tournament').on(table.tournament_id, table.steamid64),
}));

export type MatchzyStatsMatch = typeof matchzyStatsMatches.$inferSelect;
export type MatchzyStatsMap = typeof matchzyStatsMaps.$inferSelect;
export type MatchzyStatsPlayer = typeof matchzyStatsPlayers.$inferSelect;
export type UserInfo = typeof userInfo.$inferSelect;
export type NewUserInfo = typeof userInfo.$inferInsert;
export type Server = typeof servers.$inferSelect;
export type NewServer = typeof servers.$inferInsert;
export type Tournament = typeof tournaments.$inferSelect;
export type NewTournament = typeof tournaments.$inferInsert;
export type TournamentPlayer = typeof tournamentPlayers.$inferSelect;
export type NewTournamentPlayer = typeof tournamentPlayers.$inferInsert;

