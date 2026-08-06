export interface GameServer {
  id: string;
  name: string;
  type: string;
  ip: string;
  port: number;
  internalIp: string;
}

export interface PlayerInfo {
  name: string;
  raw?: {
    score?: number;
    time?: number;
  };
}

export type ServerOnlineStatus = 'online' | 'offline' | 'unknown';

export interface ServerMetadata {
  status: ServerOnlineStatus;
  players: {
    online: number | null;
    total: number | null;
    list: PlayerInfo[];
  };
  map: string | null;
  ping: number | null;
  queriedAt: string | null;
}

export type ServerModRequirement = 'required' | 'optional';

export interface ServerMod {
  provider: 'thunderstore';
  community: string;
  namespace: string;
  packageName: string;
  displayName: string;
  versionNumber: string;
  description: string | null;
  iconUrl: string | null;
  packageUrl: string;
  requirement: ServerModRequirement;
}

export interface ServerStatus {
  id: string;
  name: string;
  game: string;
  gameName: string;
  gameImage: string;
  connectionLink: string | null;
  connectionGuide: string | null;
  description: string | null;
  metadataUrl: string | null;
  mods: ServerMod[];
  metadata: ServerMetadata;
}
