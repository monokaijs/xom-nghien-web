export interface ServerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  type: string;
  description: string;
  backgroundImage: string;
}

export interface ServerStatus {
  id: string;
  name: string;
  ip: string;
  port: number;
  type: string;
  online: boolean;
  players: {
    current: number;
    max: number;
  };
  map?: string;
  ping?: number;
  lastUpdated: string;
  error?: string;
}

// CS2 Skin Types
export interface CS2Skin {
  weapon_defindex: number;
  weapon_name: string;
  paint: string | number;
  image: string;
  paint_name: string;
  legacy_model: boolean;
  threejsmodel?: string;
  texture?: string;
  texture_metal?: string;
}

export interface CS2Agent {
  team: number;
  image: string;
  model: string;
  agent_name: string;
}

export interface CS2Glove {
  weapon_defindex: number | string;
  weapon_name?: string;
  paint: string | number;
  image: string;
  paint_name: string;
  legacy_model?: boolean;
  threejsmodel?: string;
  texture?: string;
  texture_metal?: string;
}

export interface CS2Music {
  id: string;
  name: string;
  image: string;
}

export interface CS2Sticker {
  id: string;
  name: string;
  image: string;
}

export interface CS2Keychain {
  id: string;
  name: string;
  image: string;
}

export interface UserSkinConfig {
  steamid: string;
  weapon_team: number;
  weapon_defindex: number;
  weapon_paint_id: string | number;
  weapon_wear: number;
  weapon_seed: number;
  weapon_nametag: string;
  weapon_stattrak: number;
  weapon_sticker_0?: string;
  weapon_sticker_1?: string;
  weapon_sticker_2?: string;
  weapon_sticker_3?: string;
  weapon_sticker_4?: string;
  weapon_keychain?: string;
}

export interface User {
  steamid: string;
  username: string;
  avatar: string;
  profileurl: string;
}

export interface ServerResponse {
  servers: ServerStatus[];
  lastUpdated: string;
  nextUpdate?: string;
  error?: string;
}
