import { mysqlTable, int, varchar, float, tinyint, text, timestamp, index, unique, boolean, bigint, datetime } from 'drizzle-orm/mysql-core';

export const playerInventory = mysqlTable('wp_player_inventory', {
  id: int('id').primaryKey().autoincrement(),
  steamid: varchar('steamid', { length: 64 }).notNull(),
  weapon_defindex: int('weapon_defindex').notNull(),
  weapon_paint_id: varchar('weapon_paint_id', { length: 64 }).notNull(),
  weapon_wear: float('weapon_wear').default(0.0).notNull(),
  weapon_seed: int('weapon_seed').default(0).notNull(),
  weapon_nametag: varchar('weapon_nametag', { length: 255 }).default('').notNull(),
  weapon_stattrak: tinyint('weapon_stattrak').default(0).notNull(),
  weapon_sticker_0: text('weapon_sticker_0'),
  weapon_sticker_1: text('weapon_sticker_1'),
  weapon_sticker_2: text('weapon_sticker_2'),
  weapon_sticker_3: text('weapon_sticker_3'),
  weapon_sticker_4: text('weapon_sticker_4'),
  weapon_keychain: text('weapon_keychain'),
  equipped_ct: boolean('equipped_ct').default(false).notNull(),
  equipped_t: boolean('equipped_t').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueSkin: unique('unique_skin').on(table.steamid, table.weapon_defindex, table.weapon_paint_id),
  idxSteamid: index('idx_steamid').on(table.steamid),
  idxEquipped: index('idx_equipped').on(table.equipped_ct, table.equipped_t),
}));

export const playerSkins = mysqlTable('wp_player_skins', {
  id: int('id').primaryKey().autoincrement(),
  steamid: varchar('steamid', { length: 64 }).notNull(),
  weapon_team: int('weapon_team').notNull(),
  weapon_defindex: int('weapon_defindex').notNull(),
  weapon_paint_id: varchar('weapon_paint_id', { length: 64 }).notNull(),
  weapon_wear: float('weapon_wear').default(0.0).notNull(),
  weapon_seed: int('weapon_seed').default(0).notNull(),
  weapon_nametag: varchar('weapon_nametag', { length: 255 }).default('').notNull(),
  weapon_stattrak: tinyint('weapon_stattrak').default(0).notNull(),
  weapon_sticker_0: text('weapon_sticker_0'),
  weapon_sticker_1: text('weapon_sticker_1'),
  weapon_sticker_2: text('weapon_sticker_2'),
  weapon_sticker_3: text('weapon_sticker_3'),
  weapon_sticker_4: text('weapon_sticker_4'),
  weapon_keychain: text('weapon_keychain'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniquePlayerWeapon: unique('unique_player_weapon').on(table.steamid, table.weapon_team, table.weapon_defindex),
  idxSteamid: index('idx_steamid').on(table.steamid),
  idxWeaponTeam: index('idx_weapon_team').on(table.weapon_team),
}));

export type PlayerInventory = typeof playerInventory.$inferSelect;
export type NewPlayerInventory = typeof playerInventory.$inferInsert;
export type PlayerSkin = typeof playerSkins.$inferSelect;
export type NewPlayerSkin = typeof playerSkins.$inferInsert;

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
  pk: index('pk_matchzy_stats_maps').on(table.matchid, table.mapnumber),
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
  pk: index('pk_matchzy_stats_players').on(table.matchid, table.mapnumber, table.steamid64),
}));

export const userInfo = mysqlTable('user_info', {
  steamid64: varchar('steamid64', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  avatar: varchar('avatar', { length: 512 }),
  avatarmedium: varchar('avatarmedium', { length: 512 }),
  avatarfull: varchar('avatarfull', { length: 512 }),
  profileurl: varchar('profileurl', { length: 512 }),
  last_updated: timestamp('last_updated').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  idxLastUpdated: index('idx_last_updated').on(table.last_updated),
}));

export type MatchzyStatsMatch = typeof matchzyStatsMatches.$inferSelect;
export type MatchzyStatsMap = typeof matchzyStatsMaps.$inferSelect;
export type MatchzyStatsPlayer = typeof matchzyStatsPlayers.$inferSelect;
export type UserInfo = typeof userInfo.$inferSelect;
export type NewUserInfo = typeof userInfo.$inferInsert;

