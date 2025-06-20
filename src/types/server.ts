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

export interface ServerResponse {
  servers: ServerStatus[];
  lastUpdated: string;
  nextUpdate?: string;
  error?: string;
}
