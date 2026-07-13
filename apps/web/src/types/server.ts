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
  game: string;
  gameName: string;
  gameImage: string;
  connectionMethod: 'direct' | 'guidance';
  connectionLink: string | null;
  connectionGuide: string | null;
  description: string | null;
  metadataUrl: string | null;
}
