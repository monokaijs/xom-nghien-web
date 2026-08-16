import { describe, expect, it } from 'vitest';
import { getGameServerLaunchUrl, parseGameServerInput } from './game-servers';

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

describe('getGameServerLaunchUrl', () => {
  it('opens Valheim servers through the Xom Nghien launcher using only the server ID', () => {
    expect(getGameServerLaunchUrl('valheim.example.com:2456', 'valheim', '10'))
      .toBe('xomnghien://servers/10');
    expect(getGameServerLaunchUrl(null, 'valheim', '10'))
      .toBe('xomnghien://servers/10');
  });

  it('rejects malformed Valheim server IDs', () => {
    expect(getGameServerLaunchUrl('valheim.example.com:2456', 'valheim', '../10')).toBeNull();
    expect(getGameServerLaunchUrl('valheim.example.com:2456', 'valheim')).toBeNull();
  });

  it('keeps direct Steam links for Palworld connections', () => {
    expect(getGameServerLaunchUrl('palworld.example.com:8211', 'palworld'))
      .toBe('steam://connect/palworld.example.com:8211');
  });
});
