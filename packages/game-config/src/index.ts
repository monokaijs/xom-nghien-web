export type GameKey = 'cs2';
export type CredentialType = 'gslt';
export type PortProtocol = 'tcp' | 'udp';

export interface PortRequest {
  name: string;
  containerPort: number;
  protocols: PortProtocol[];
}

export interface Cs2ModePreset {
  mode: string;
  label: string;
  exec: string;
}

export interface Cs2CustomFile {
  path: string;
  content: string;
}

export type Cs2EnvValue = string | number | boolean;

export interface Cs2ServerConfig extends Record<string, unknown> {
  mode: string;
  modeLabel: string;
  modeExec: string;
  map: string;
  maxPlayers: number;
  tickRate: number;
  serverPassword?: string;
  admins: string[];
  startupCommands: string[];
  env: Record<string, Cs2EnvValue>;
  customFiles: Cs2CustomFile[];
}

export interface GameDefinition<TConfig extends Record<string, unknown>> {
  key: GameKey;
  label: string;
  credentialType?: CredentialType;
  validateConfig(input: unknown): TConfig;
  getRequiredPorts(config: TConfig): PortRequest[];
}

export const CS2_MODE_PRESETS = [
  { mode: 'competitive', label: 'Competitive', exec: 'comp.cfg' },
  { mode: 'wingman', label: 'Wingman', exec: 'wingman.cfg' },
  { mode: 'deathmatch', label: 'Deathmatch', exec: 'dm.cfg' },
  { mode: '1v1', label: 'Solo 1v1', exec: '1v1.cfg' },
  { mode: 'gg', label: 'Gun Game', exec: 'gg.cfg' },
  { mode: 'practice', label: 'Practice', exec: 'practice.cfg' },
  { mode: 'retake', label: 'Retakes', exec: 'retake.cfg' },
  { mode: 'executes', label: 'Executes', exec: 'executes.cfg' },
  { mode: 'prefire', label: 'Prefire', exec: 'prefire.cfg' },
  { mode: 'awp', label: 'AWP', exec: 'awp.cfg' },
  { mode: 'aim', label: 'Aim', exec: 'aim.cfg' },
  { mode: 'surf', label: 'Surf', exec: 'surf.cfg' },
  { mode: 'bhop', label: 'Bhop', exec: 'bhop.cfg' },
  { mode: 'kz', label: 'KZ', exec: 'kz.cfg' },
  { mode: 'minigames', label: 'Minigames', exec: 'minigames.cfg' },
  { mode: 'deathrun', label: 'Deathrun', exec: 'deathrun.cfg' },
  { mode: 'course', label: 'Course', exec: 'course.cfg' },
  { mode: 'scoutzknivez', label: 'ScoutzKnivez', exec: 'scoutzknivez.cfg' },
  { mode: 'hns', label: 'Hide and Seek', exec: 'hns.cfg' },
  { mode: 'ctf', label: 'Capture The Flag', exec: 'ctf.cfg' },
  { mode: 'oitc', label: 'One In The Chamber', exec: 'oitc.cfg' },
  { mode: 'soccer', label: 'Soccer', exec: 'soccer.cfg' },
  { mode: 'battle', label: 'Battle Royale', exec: 'battle.cfg' },
  { mode: 'br', label: 'Battle Royale Classic', exec: 'br.cfg' },
  { mode: 'valve-competitive', label: 'Valve Competitive', exec: 'valve-competitive.cfg' },
  { mode: 'valve-wingman', label: 'Valve Wingman', exec: 'valve-wingman.cfg' },
  { mode: 'valve-deathmatch', label: 'Valve Deathmatch', exec: 'valve-deathmatch.cfg' },
  { mode: 'valve-retake', label: 'Valve Retake', exec: 'valve-retake.cfg' },
  { mode: 'valve-armsrace', label: 'Valve Arms Race', exec: 'valve-armsrace.cfg' },
] as const satisfies readonly Cs2ModePreset[];

export const CS2_MODES = CS2_MODE_PRESETS.map((preset) => preset.mode);
export type Cs2Mode = string;

export const CS2_MAPS = [
  'de_dust2',
  'de_mirage',
  'de_inferno',
  'de_nuke',
  'de_overpass',
  'de_ancient',
  'de_anubis',
  'de_vertigo',
  'cs_office',
  'cs_italy',
] as const;

export type Cs2Map = string;

export const CS2_MODE_LABELS: Record<string, string> = Object.fromEntries(
  CS2_MODE_PRESETS.map((preset) => [preset.mode, preset.label]),
);

export const CS2_MODE_EXEC_FILES: Record<string, string> = Object.fromEntries(
  CS2_MODE_PRESETS.map((preset) => [preset.mode, preset.exec]),
);

export const CS2_MAP_LABELS: Record<string, string> = {
  de_dust2: 'Dust II',
  de_mirage: 'Mirage',
  de_inferno: 'Inferno',
  de_nuke: 'Nuke',
  de_overpass: 'Overpass',
  de_ancient: 'Ancient',
  de_anubis: 'Anubis',
  de_vertigo: 'Vertigo',
  cs_office: 'Office',
  cs_italy: 'Italy',
};

export const CS2_RESERVED_ENV_KEYS = [
  'API_KEY',
  'CUSTOM_FOLDER',
  'EXEC',
  'MAXPLAYERS',
  'PORT',
  'RCON_PASSWORD',
  'SERVER_PASSWORD',
  'STEAM_ACCOUNT',
  'TICKRATE',
] as const;

export const CS2_BOOT_CONFIG_PATH = 'cfg/xom_boot.cfg';
export const CS2_BOOT_EXEC_FILE = 'xom_boot.cfg';
export const CS2_MATCHZY_ADMINS_PATH = 'cfg/MatchZy/admins.json';
export const CS2_CSSHARP_ADMINS_PATH = 'addons/counterstrikesharp/configs/admins.json';

const RESERVED_ENV_KEYS = new Set<string>(CS2_RESERVED_ENV_KEYS);
const ENV_KEY_PATTERN = /^[A-Z_][A-Z0-9_]*$/;
const COMMAND_TOKEN_PATTERN = /^[A-Za-z0-9_./-]+$/;

export function assertPlainObject(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Configuration must be an object');
  }
}

function readString(value: unknown, field: string) {
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string`);
  }
  return value.trim();
}

function readRawString(value: unknown, field: string) {
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string`);
  }
  return value;
}

function readOptionalString(value: unknown, field: string) {
  if (value === undefined || value === null || value === '') return undefined;
  return readString(value, field);
}

function readNumber(value: unknown, field: string) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} must be a number`);
  }
  return parsed;
}

function readBooleanEnvValue(value: unknown, field: string) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${field} must be a boolean`);
}

function readEnvValue(value: unknown, field: string): Cs2EnvValue {
  if (typeof value === 'string') {
    if (value.includes('\0') || value.includes('\n') || value.includes('\r')) {
      throw new Error(`${field} must be a single-line text value`);
    }
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`${field} must be a finite number`);
    }
    return value;
  }
  if (typeof value === 'boolean') {
    return readBooleanEnvValue(value, field);
  }
  throw new Error(`${field} must be a string, number, or boolean`);
}

function readOptionalArray(value: unknown, field: string) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array`);
  }
  return value;
}

function readSingleLine(value: unknown, field: string) {
  const text = readString(value, field);
  if (text.includes('\0') || text.includes('\n') || text.includes('\r')) {
    throw new Error(`${field} must be a single line`);
  }
  return text;
}

function readCommandToken(value: unknown, field: string) {
  const text = readSingleLine(value, field);
  if (!text || !COMMAND_TOKEN_PATTERN.test(text) || text.includes('..')) {
    throw new Error(`${field} contains unsafe characters`);
  }
  return text;
}

export function getCs2ModePreset(mode: string) {
  return CS2_MODE_PRESETS.find((preset) => preset.mode === mode);
}

export function normalizeCs2CustomFilePath(value: unknown, field = 'custom file path') {
  const path = readSingleLine(value, field).replace(/\\/g, '/');
  const lowered = path.toLowerCase();

  if (!path) {
    throw new Error(`${field} is required`);
  }
  if (lowered === 'custom_files' || lowered.startsWith('custom_files/')) {
    throw new Error(`${field} must be relative to custom_files and must not include custom_files/`);
  }
  if (path.startsWith('/') || path.includes('..') || path.includes('\0')) {
    throw new Error(`${field} must be a safe relative path`);
  }
  if (path.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error(`${field} must not contain empty, current, or parent path segments`);
  }

  return path;
}

function readModeExec(value: unknown, mode: string) {
  const preset = getCs2ModePreset(mode);
  const execFile = readOptionalString(value, 'modeExec') || preset?.exec;
  if (!execFile) {
    throw new Error('modeExec is required for custom modes');
  }
  const path = normalizeCs2CustomFilePath(execFile, 'modeExec');
  if (!COMMAND_TOKEN_PATTERN.test(path)) {
    throw new Error('modeExec contains unsafe characters');
  }
  return path;
}

function readModeLabel(value: unknown, mode: string) {
  const preset = getCs2ModePreset(mode);
  const label = readOptionalString(value, 'modeLabel') || preset?.label || mode;
  if (!label) {
    throw new Error('modeLabel is required');
  }
  if (label.includes('\0') || label.length > 80) {
    throw new Error('modeLabel is invalid');
  }
  return label;
}

function readAdmins(value: unknown) {
  return readOptionalArray(value, 'admins')
    .map((admin, index) => readSingleLine(admin, `admins[${index}]`))
    .filter(Boolean);
}

function readStartupCommands(value: unknown) {
  return readOptionalArray(value, 'startupCommands')
    .map((command, index) => readSingleLine(command, `startupCommands[${index}]`))
    .filter(Boolean);
}

function readEnv(input: Record<string, unknown>) {
  const raw = input.env ?? {};
  assertPlainObject(raw);

  const env: Record<string, Cs2EnvValue> = {};
  for (const [rawKey, rawValue] of Object.entries(raw)) {
    const key = rawKey.trim().toUpperCase();
    if (!key) continue;
    if (!ENV_KEY_PATTERN.test(key)) {
      throw new Error(`Invalid env key: ${rawKey}`);
    }
    if (RESERVED_ENV_KEYS.has(key)) {
      throw new Error(`${key} is managed by the system and cannot be overridden`);
    }
    env[key] = readEnvValue(rawValue, `env.${key}`);
  }

  return env;
}

function readCustomFiles(value: unknown) {
  return readOptionalArray(value, 'customFiles').map((file, index) => {
    assertPlainObject(file);
    const path = normalizeCs2CustomFilePath(file.path, `customFiles[${index}].path`);
    const content = readRawString(file.content ?? '', `customFiles[${index}].content`);

    if (content.includes('\0')) {
      throw new Error(`customFiles[${index}].content must be text`);
    }
    if (path.toLowerCase().endsWith('.json') && content.trim()) {
      try {
        JSON.parse(content);
      } catch {
        throw new Error(`${path} contains invalid JSON`);
      }
    }

    return { path, content };
  });
}

function assertUniqueCustomFilePaths(files: Cs2CustomFile[]) {
  const paths = new Set<string>();
  for (const file of files) {
    const key = file.path.toLowerCase();
    if (paths.has(key)) {
      throw new Error(`Duplicate custom file path: ${file.path}`);
    }
    paths.add(key);
  }
}

export function validateCs2Config(input: unknown): Cs2ServerConfig {
  assertPlainObject(input);
  const mode = readCommandToken(input.mode, 'mode');
  const modeLabel = readModeLabel(input.modeLabel, mode);
  const modeExec = readModeExec(input.modeExec, mode);
  const map = readCommandToken(input.map, 'map');
  const maxPlayers = readNumber(input.maxPlayers ?? 10, 'maxPlayers');
  const tickRate = readNumber(input.tickRate ?? 128, 'tickRate');
  const serverPassword = readOptionalString(input.serverPassword, 'serverPassword');
  const admins = readAdmins(input.admins);
  const startupCommands = readStartupCommands(input.startupCommands);
  const env = readEnv(input);
  const customFiles = readCustomFiles(input.customFiles);

  assertUniqueCustomFilePaths(customFiles);

  if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 64) {
    throw new Error('maxPlayers must be between 2 and 64');
  }
  if (![64, 128].includes(tickRate)) {
    throw new Error('tickRate must be 64 or 128');
  }
  if (serverPassword && (serverPassword.includes('\0') || serverPassword.includes('\n') || serverPassword.includes('\r'))) {
    throw new Error('serverPassword must be a single line');
  }

  return {
    mode,
    modeLabel,
    modeExec,
    map,
    maxPlayers,
    tickRate,
    serverPassword,
    admins,
    startupCommands,
    env,
    customFiles,
  };
}

export function getCs2RequiredPorts(): PortRequest[] {
  return [
    {
      name: 'game',
      containerPort: 27015,
      protocols: ['tcp', 'udp'],
    },
  ];
}

export function renderCs2BootConfig(config: Cs2ServerConfig) {
  const commands = [
    `exec_after_delay 30 "changelevel ${config.map}"`,
    `exec_after_delay 50 "exec ${config.modeExec}"`,
    ...config.startupCommands,
  ];

  return `${commands.join('\n')}\n`;
}

export function renderCs2MatchzyAdmins(admins: string[]) {
  const content: Record<string, string> = {};
  admins.forEach((admin) => {
    content[admin] = '';
  });
  return `${JSON.stringify(content, null, 2)}\n`;
}

export function renderCs2CounterStrikeSharpAdmins(admins: string[]) {
  const content: Record<string, { identity: string; groups: string[] }> = {};
  admins.forEach((admin, index) => {
    content[`XOM Admin ${index + 1}`] = {
      identity: admin,
      groups: ['#css/admin'],
    };
  });
  return `${JSON.stringify(content, null, 2)}\n`;
}

export function renderCs2CustomFiles(config: Cs2ServerConfig): Cs2CustomFile[] {
  const customPathSet = new Set(config.customFiles.map((file) => file.path.toLowerCase()));
  const managedFiles: Cs2CustomFile[] = [];

  if (!customPathSet.has(CS2_BOOT_CONFIG_PATH.toLowerCase())) {
    managedFiles.push({
      path: CS2_BOOT_CONFIG_PATH,
      content: renderCs2BootConfig(config),
    });
  }

  if (config.admins.length > 0 && !customPathSet.has(CS2_MATCHZY_ADMINS_PATH.toLowerCase())) {
    managedFiles.push({
      path: CS2_MATCHZY_ADMINS_PATH,
      content: renderCs2MatchzyAdmins(config.admins),
    });
  }

  if (config.admins.length > 0 && !customPathSet.has(CS2_CSSHARP_ADMINS_PATH.toLowerCase())) {
    managedFiles.push({
      path: CS2_CSSHARP_ADMINS_PATH,
      content: renderCs2CounterStrikeSharpAdmins(config.admins),
    });
  }

  return [...managedFiles, ...config.customFiles];
}

const definitions: Record<GameKey, GameDefinition<any>> = {
  cs2: {
    key: 'cs2',
    label: 'Counter-Strike 2',
    credentialType: 'gslt',
    validateConfig: validateCs2Config,
    getRequiredPorts: getCs2RequiredPorts,
  },
};

export function getGameDefinition(gameKey: string) {
  const definition = definitions[gameKey as GameKey];
  if (!definition) {
    throw new Error(`Unsupported game: ${gameKey}`);
  }
  return definition;
}

export function listGameDefinitions() {
  return Object.values(definitions).map((definition) => ({
    key: definition.key,
    label: definition.label,
    credentialType: definition.credentialType || null,
  }));
}
