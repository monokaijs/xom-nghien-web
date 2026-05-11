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

export const vpsInstances = mysqlTable('vps_instances', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  ip: varchar('ip', { length: 45 }).notNull(),
  port: int('port').notNull().default(22),
  username: varchar('username', { length: 255 }).notNull(),
  privateKey: text('private_key').notNull(),
  openPortRangeStart: int('open_port_range_start').notNull(),
  openPortRangeEnd: int('open_port_range_end').notNull(),
  maxGameInstances: int('max_game_instances').notNull().default(5),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueIp: unique('unique_vps_ip').on(table.ip),
}));

export const steamApiKeys = mysqlTable('steam_api_keys', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  steamAccount: varchar('steam_account', { length: 255 }),
  isActive: tinyint('is_active').notNull().default(1),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const tempGameServers = mysqlTable('temp_game_servers', {
  id: int('id').primaryKey().autoincrement(),
  vpsId: int('vps_id').notNull(),
  steamApiKeyId: int('steam_api_key_id'),
  assignedPort: int('assigned_port').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('offline'),
  rconPassword: varchar('rcon_password', { length: 255 }).notNull(),
  containerId: varchar('container_id', { length: 255 }),
  createdBy: varchar('created_by', { length: 64 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  expires_at: timestamp('expires_at').notNull(),
}, (table) => ({
  idxVpsId: index('idx_temp_server_vps_id').on(table.vpsId),
  idxSteamApiKeyId: index('idx_temp_server_steam_api_key_id').on(table.steamApiKeyId),
  idxExpiresAt: index('idx_temp_server_expires_at').on(table.expires_at),
  idxCreatedBy: index('idx_temp_server_created_by').on(table.createdBy),
  uniqueVpsPort: unique('unique_vps_port').on(table.vpsId, table.assignedPort),
}));

export const lobbies = mysqlTable('lobbies', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  gameMode: varchar('game_mode', { length: 50 }).notNull(),
  maxPlayers: int('max_players').notNull().default(10),
  map: varchar('map', { length: 100 }).notNull(),
  serverPassword: varchar('server_password', { length: 255 }),
  tempGameServerId: int('temp_game_server_id'),
  createdBy: varchar('created_by', { length: 64 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  expires_at: timestamp('expires_at').notNull(),
}, (table) => ({
  idxTempGameServerId: index('idx_lobby_temp_game_server_id').on(table.tempGameServerId),
  idxCreatedBy: index('idx_lobby_created_by').on(table.createdBy),
  idxExpiresAt: index('idx_lobby_expires_at').on(table.expires_at),
}));

export const serverHosts = mysqlTable('server_hosts', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  publicAddress: varchar('public_address', { length: 255 }).notNull(),
  sshHost: varchar('ssh_host', { length: 255 }).notNull(),
  sshPort: int('ssh_port').notNull().default(22),
  sshUsername: varchar('ssh_username', { length: 255 }).notNull(),
  encryptedPrivateKey: text('encrypted_private_key').notNull(),
  baseDeployPath: varchar('base_deploy_path', { length: 512 }).notNull().default('~/game-servers'),
  portRangeStart: int('port_range_start').notNull(),
  portRangeEnd: int('port_range_end').notNull(),
  maxInstances: int('max_instances').notNull().default(5),
  enabled: tinyint('enabled').notNull().default(1),
  healthStatus: varchar('health_status', { length: 30 }).notNull().default('unknown'),
  lastCheckedAt: timestamp('last_checked_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  idxEnabled: index('idx_server_host_enabled').on(table.enabled),
  uniqueSshHost: unique('unique_server_host_ssh').on(table.sshHost, table.sshPort),
}));

export const gameConfigurations = mysqlTable('game_configurations', {
  id: int('id').primaryKey().autoincrement(),
  gameKey: varchar('game_key', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  currentVersionId: int('current_version_id'),
  isActive: tinyint('is_active').notNull().default(1),
  createdBy: varchar('created_by', { length: 64 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  idxGameKey: index('idx_game_configuration_game_key').on(table.gameKey),
  idxActive: index('idx_game_configuration_active').on(table.isActive),
}));

export const gameConfigurationVersions = mysqlTable('game_configuration_versions', {
  id: int('id').primaryKey().autoincrement(),
  configurationId: int('configuration_id').notNull(),
  versionNumber: int('version_number').notNull(),
  config: json('config').$type<Record<string, unknown>>().notNull(),
  createdBy: varchar('created_by', { length: 64 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  idxConfigurationId: index('idx_game_configuration_version_config_id').on(table.configurationId),
  uniqueVersion: unique('unique_game_configuration_version').on(table.configurationId, table.versionNumber),
}));

export const gameCredentials = mysqlTable('game_credentials', {
  id: int('id').primaryKey().autoincrement(),
  gameKey: varchar('game_key', { length: 50 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  encryptedValue: text('encrypted_value').notNull(),
  isActive: tinyint('is_active').notNull().default(1),
  assignedInstanceId: int('assigned_instance_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  idxGameType: index('idx_game_credential_game_type').on(table.gameKey, table.type),
  idxAssignedInstance: index('idx_game_credential_assigned_instance').on(table.assignedInstanceId),
}));

export const serverHostPortAllocations = mysqlTable('server_host_port_allocations', {
  id: int('id').primaryKey().autoincrement(),
  hostId: int('host_id').notNull(),
  instanceId: int('instance_id').notNull(),
  port: int('port').notNull(),
  protocol: varchar('protocol', { length: 10 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  idxHostId: index('idx_server_host_port_host_id').on(table.hostId),
  idxInstanceId: index('idx_server_host_port_instance_id').on(table.instanceId),
  uniqueHostPortProtocol: unique('unique_server_host_port_protocol').on(table.hostId, table.port, table.protocol),
}));

export const gameServerDeployments = mysqlTable('game_server_deployments', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('queued'),
  totalCount: int('total_count').notNull().default(0),
  queuedCount: int('queued_count').notNull().default(0),
  succeededCount: int('succeeded_count').notNull().default(0),
  failedCount: int('failed_count').notNull().default(0),
  createdBy: varchar('created_by', { length: 64 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  idxStatus: index('idx_game_server_deployment_status').on(table.status),
}));

export const gameServerInstances = mysqlTable('game_server_instances', {
  id: int('id').primaryKey().autoincrement(),
  deploymentId: int('deployment_id'),
  hostId: int('host_id').notNull(),
  configurationId: int('configuration_id').notNull(),
  configurationVersionId: int('configuration_version_id').notNull(),
  gameKey: varchar('game_key', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('queued'),
  desiredState: varchar('desired_state', { length: 30 }).notNull().default('online'),
  visibility: varchar('visibility', { length: 30 }).notNull().default('public'),
  ownerId: varchar('owner_id', { length: 64 }),
  dockerProjectName: varchar('docker_project_name', { length: 255 }).notNull(),
  containerName: varchar('container_name', { length: 255 }).notNull(),
  connectAddress: varchar('connect_address', { length: 255 }),
  queryPort: int('query_port'),
  ports: json('ports').$type<Array<{ name: string; hostPort: number; containerPort: number; protocol: string }>>().notNull(),
  configSnapshot: json('config_snapshot').$type<Record<string, unknown>>().notNull(),
  encryptedRconPassword: text('encrypted_rcon_password').notNull(),
  encryptedServerPassword: text('encrypted_server_password'),
  credentialId: int('credential_id'),
  lastError: text('last_error'),
  provisionedAt: timestamp('provisioned_at'),
  expiresAt: timestamp('expires_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  idxDeploymentId: index('idx_game_server_instance_deployment_id').on(table.deploymentId),
  idxHostId: index('idx_game_server_instance_host_id').on(table.hostId),
  idxStatus: index('idx_game_server_instance_status').on(table.status),
  idxVisibility: index('idx_game_server_instance_visibility').on(table.visibility),
  uniqueDockerProjectName: unique('unique_game_server_instance_project').on(table.dockerProjectName),
}));

export const gameServerJobs = mysqlTable('game_server_jobs', {
  id: int('id').primaryKey().autoincrement(),
  instanceId: int('instance_id').notNull(),
  deploymentId: int('deployment_id'),
  bullmqJobId: varchar('bullmq_job_id', { length: 255 }),
  type: varchar('type', { length: 30 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('queued'),
  attempts: int('attempts').notNull().default(0),
  maxAttempts: int('max_attempts').notNull().default(3),
  lockedBy: varchar('locked_by', { length: 255 }),
  lockedAt: timestamp('locked_at'),
  payload: json('payload').$type<Record<string, unknown>>(),
  error: text('error'),
  scheduledAt: timestamp('scheduled_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  idxStatusScheduled: index('idx_game_server_job_status_scheduled').on(table.status, table.scheduledAt),
  idxInstanceId: index('idx_game_server_job_instance_id').on(table.instanceId),
  idxBullmqJobId: index('idx_game_server_job_bullmq_id').on(table.bullmqJobId),
}));

export const serverHostJobs = mysqlTable('server_host_jobs', {
  id: int('id').primaryKey().autoincrement(),
  hostId: int('host_id').notNull(),
  bullmqJobId: varchar('bullmq_job_id', { length: 255 }),
  type: varchar('type', { length: 30 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('queued'),
  attempts: int('attempts').notNull().default(0),
  maxAttempts: int('max_attempts').notNull().default(3),
  payload: json('payload').$type<Record<string, unknown>>(),
  error: text('error'),
  scheduledAt: timestamp('scheduled_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  idxHostId: index('idx_server_host_job_host_id').on(table.hostId),
  idxStatusScheduled: index('idx_server_host_job_status_scheduled').on(table.status, table.scheduledAt),
  idxBullmqJobId: index('idx_server_host_job_bullmq_id').on(table.bullmqJobId),
}));

export const gameServerEvents = mysqlTable('game_server_events', {
  id: int('id').primaryKey().autoincrement(),
  instanceId: int('instance_id'),
  deploymentId: int('deployment_id'),
  type: varchar('type', { length: 50 }).notNull(),
  level: varchar('level', { length: 20 }).notNull().default('info'),
  message: text('message').notNull(),
  metadata: json('metadata').$type<Record<string, unknown>>(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  idxInstanceId: index('idx_game_server_event_instance_id').on(table.instanceId),
  idxDeploymentId: index('idx_game_server_event_deployment_id').on(table.deploymentId),
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
export type VpsInstance = typeof vpsInstances.$inferSelect;
export type NewVpsInstance = typeof vpsInstances.$inferInsert;
export type SteamApiKey = typeof steamApiKeys.$inferSelect;
export type NewSteamApiKey = typeof steamApiKeys.$inferInsert;
export type TempGameServer = typeof tempGameServers.$inferSelect;
export type NewTempGameServer = typeof tempGameServers.$inferInsert;
export type Lobby = typeof lobbies.$inferSelect;
export type NewLobby = typeof lobbies.$inferInsert;
export type ServerHost = typeof serverHosts.$inferSelect;
export type NewServerHost = typeof serverHosts.$inferInsert;
export type GameConfiguration = typeof gameConfigurations.$inferSelect;
export type NewGameConfiguration = typeof gameConfigurations.$inferInsert;
export type GameConfigurationVersion = typeof gameConfigurationVersions.$inferSelect;
export type NewGameConfigurationVersion = typeof gameConfigurationVersions.$inferInsert;
export type GameCredential = typeof gameCredentials.$inferSelect;
export type NewGameCredential = typeof gameCredentials.$inferInsert;
export type GameServerDeployment = typeof gameServerDeployments.$inferSelect;
export type NewGameServerDeployment = typeof gameServerDeployments.$inferInsert;
export type GameServerInstance = typeof gameServerInstances.$inferSelect;
export type NewGameServerInstance = typeof gameServerInstances.$inferInsert;
export type GameServerJob = typeof gameServerJobs.$inferSelect;
export type NewGameServerJob = typeof gameServerJobs.$inferInsert;
export type ServerHostJob = typeof serverHostJobs.$inferSelect;
export type NewServerHostJob = typeof serverHostJobs.$inferInsert;
export type GameServerEvent = typeof gameServerEvents.$inferSelect;
export type NewGameServerEvent = typeof gameServerEvents.$inferInsert;
