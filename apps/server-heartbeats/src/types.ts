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

export interface ServerTarget {
  id: number;
  game: string;
  connectionLink: string | null;
  metadataUrl: string | null;
}

export interface HeartbeatSnapshot {
  statuses: Record<string, ServerMetadata>;
  refreshedAt: string | null;
  refreshing: boolean;
}
