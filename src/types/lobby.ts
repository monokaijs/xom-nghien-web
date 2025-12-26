export enum GameMode {
  Competitive = 'competitive',
  Wingman = 'wingman',
  Deathmatch = 'deathmatch',
  Solo1v1 = '1v1',
  GunGame = 'gg',
}

export enum CS2Map {
  Dust2 = 'de_dust2',
  Mirage = 'de_mirage',
  Inferno = 'de_inferno',
  Nuke = 'de_nuke',
  Overpass = 'de_overpass',
  Ancient = 'de_ancient',
  Anubis = 'de_anubis',
  Vertigo = 'de_vertigo',
  Office = 'cs_office',
  Italy = 'cs_italy',
}

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  [GameMode.Competitive]: 'Competitive',
  [GameMode.Wingman]: 'Wingman',
  [GameMode.Deathmatch]: 'Death Match',
  [GameMode.Solo1v1]: 'Solo (1v1)',
  [GameMode.GunGame]: 'Gun Game',
};

export const CS2_MAP_LABELS: Record<CS2Map, string> = {
  [CS2Map.Dust2]: 'Dust II',
  [CS2Map.Mirage]: 'Mirage',
  [CS2Map.Inferno]: 'Inferno',
  [CS2Map.Nuke]: 'Nuke',
  [CS2Map.Overpass]: 'Overpass',
  [CS2Map.Ancient]: 'Ancient',
  [CS2Map.Anubis]: 'Anubis',
  [CS2Map.Vertigo]: 'Vertigo',
  [CS2Map.Office]: 'Office',
  [CS2Map.Italy]: 'Italy',
};

export const isValidGameMode = (value: string): value is GameMode => {
  return Object.values(GameMode).includes(value as GameMode);
};

export const isValidCS2Map = (value: string): value is CS2Map => {
  return Object.values(CS2Map).includes(value as CS2Map);
};

