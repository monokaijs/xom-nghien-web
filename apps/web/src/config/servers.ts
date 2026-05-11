import {GameServer} from '@/types/server';

export const GameServers: GameServer[] = [{
  id: 'server1',
  name: '[#1] Competitive',
  type: 'counterstrike2',
  ip: 'cs2.xomnghien.com',
  internalIp: 'cs2-competitive',
  port: 27015,
}, {
  id: 'server2',
  name: '[#2] Death Match',
  type: 'counterstrike2',
  ip: 'cs2.xomnghien.com',
  internalIp: 'cs2-death-match',
  port: 27021,
}, {
  id: 'server3',
  name: '[#3] 1v1',
  type: 'counterstrike2',
  ip: 'cs2.xomnghien.com',
  internalIp: 'cs2-solo',
  port: 27025,
}]
