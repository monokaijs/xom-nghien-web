export type GameKey = 'cs2';
export type CredentialType = 'gslt';
export type PortProtocol = 'tcp' | 'udp';

export interface PortRequest {
  name: string;
  containerPort: number;
  protocols: PortProtocol[];
}

export const CS2_MODES = ['competitive', 'wingman', 'deathmatch', '1v1', 'gg'] as const;
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

export type Cs2Mode = typeof CS2_MODES[number];
export type Cs2Map = typeof CS2_MAPS[number];

export interface Cs2ServerConfig extends Record<string, unknown> {
  mode: Cs2Mode;
  map: Cs2Map;
  maxPlayers: number;
  tickRate: number;
  serverPassword?: string;
  admins: string[];
}

export interface GameDefinition<TConfig extends Record<string, unknown>> {
  key: GameKey;
  label: string;
  credentialType?: CredentialType;
  validateConfig(input: unknown): TConfig;
  getRequiredPorts(config: TConfig): PortRequest[];
}

export const CS2_MODE_LABELS: Record<Cs2Mode, string> = {
  competitive: 'Competitive',
  wingman: 'Wingman',
  deathmatch: 'Deathmatch',
  '1v1': 'Solo 1v1',
  gg: 'Gun Game',
};

export const CS2_MAP_LABELS: Record<Cs2Map, string> = {
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

export function validateCs2Config(input: unknown): Cs2ServerConfig {
  assertPlainObject(input);
  const mode = readString(input.mode, 'mode');
  const map = readString(input.map, 'map');
  const maxPlayers = readNumber(input.maxPlayers ?? 10, 'maxPlayers');
  const tickRate = readNumber(input.tickRate ?? 128, 'tickRate');
  const serverPassword = readOptionalString(input.serverPassword, 'serverPassword');
  const admins = Array.isArray(input.admins)
    ? input.admins.map((admin) => readString(admin, 'admin')).filter(Boolean)
    : [];

  if (!CS2_MODES.includes(mode as Cs2Mode)) {
    throw new Error('Invalid CS2 mode');
  }
  if (!CS2_MAPS.includes(map as Cs2Map)) {
    throw new Error('Invalid CS2 map');
  }
  if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 64) {
    throw new Error('maxPlayers must be between 2 and 64');
  }
  if (![64, 128].includes(tickRate)) {
    throw new Error('tickRate must be 64 or 128');
  }

  return {
    mode: mode as Cs2Mode,
    map: map as Cs2Map,
    maxPlayers,
    tickRate,
    serverPassword,
    admins,
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
