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
    list?: PlayerInfo[];
  };
  map?: string;
  ping?: number;
  lastUpdated: string;
  error?: string;
}