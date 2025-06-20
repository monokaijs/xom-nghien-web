export interface GameServer {
  id: string;
  name: string;
  type: string;
  ip: string;
  port: number;
}

export const GameServers: GameServer[] = [{
  id: 'server1',
  name: '[#1] PvP 5v5 | Team Checkmate',
  type: 'counterstrike2',
  ip: '160.25.82.90',
  port: 27015,
}, {
  id: 'server2',
  name: '[#2] PvP 5v5 | Team Checkmate',
  type: 'counterstrike2',
  ip: '160.25.82.90',
  port: 27021,
}, {
  id: 'server3',
  name: '[#3] PvP 5v5 | Custom Map',
  type: 'counterstrike2',
  ip: '160.25.82.90',
  port: 27025,
}]
