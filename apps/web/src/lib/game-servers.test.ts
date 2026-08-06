import { describe, expect, it } from 'vitest';
import { parseGameServerInput } from './game-servers';

const valheim = {
  game: 'valheim',
  gameName: 'Community Valheim',
  connectionLink: 'valheim.example.com:2456',
  connectionHost: 'valheim.example.com',
  connectionPort: 2456,
  joinPassword: 'vikings',
  mods: [],
};

describe('parseGameServerInput launcher connection', () => {
  it('keeps structured Valheim launcher credentials separate from the browser link', () => {
    expect(parseGameServerInput(valheim)).toMatchObject({
      connectionLink: 'valheim.example.com:2456',
      connectionHost: 'valheim.example.com',
      connectionPort: 2456,
      joinPassword: 'vikings',
    });
  });

  it('requires complete structured launcher credentials for Valheim', () => {
    expect(() => parseGameServerInput({ ...valheim, joinPassword: '' })).toThrow('host, port, and join password');
    expect(() => parseGameServerInput({ ...valheim, connectionPort: 70000 })).toThrow('between 1 and 65535');
  });

  it('clears launcher credentials for other games', () => {
    expect(parseGameServerInput({ ...valheim, game: 'palworld' })).toMatchObject({
      connectionHost: null,
      connectionPort: null,
      joinPassword: null,
    });
  });
});
