export interface GameServer {
  name: string;
  type: string;
  ip: string;
  port: number;
}

export const GameServers: GameServer[] = [{
  name: '[#1] PvP 5v5 | Team Checkmate',
  type: 'counterstrike2',
  ip: '160.25.82.90',
  port: 27015,
}, {
  name: '[#2] PvP 5v5 | Team Checkmate',
  type: 'counterstrike2',
  ip: '160.25.82.90',
  port: 27021,
}, {
  name: '[#3] PvP 5v5 | Custom Map',
  type: 'counterstrike2',
  ip: '160.25.82.90',
  port: 27025,
}]
