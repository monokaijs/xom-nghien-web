import { mysqlTable, int, varchar, float, tinyint, text, timestamp, index, unique, boolean } from 'drizzle-orm/mysql-core';

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

