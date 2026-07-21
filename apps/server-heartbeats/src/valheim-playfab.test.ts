import { describe, expect, it, vi } from 'vitest';
import { ValheimPlayFabClient } from './valheim-playfab.js';

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('ValheimPlayFabClient', () => {
  it('finds the newest active lobby by public address and reuses its entity token', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        data: {
          EntityToken: {
            EntityToken: 'entity-token',
            TokenExpiration: '2099-01-01T00:00:00.000Z',
          },
        },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          Lobbies: [
            { CurrentPlayers: 2, MaxPlayers: 11, SearchData: { string_key7: 'True', string_key9: '10' } },
            { CurrentPlayers: 4, MaxPlayers: 11, SearchData: { string_key7: 'True', string_key9: '20' } },
          ],
        },
      }))
      .mockResolvedValueOnce(jsonResponse({ data: { Lobbies: [] } }));
    const client = new ValheimPlayFabClient('6E223', 'heartbeat-test', fetchImpl);

    const lobby = await client.findActiveLobby('42.118.202.140:2456');
    expect(lobby?.CurrentPlayers).toBe(4);
    expect(ValheimPlayFabClient.playerCounts(lobby!)).toEqual({ online: 3, total: 10 });
    await client.findActiveLobby('42.118.202.140:2456');

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl.mock.calls[1][0]).toBe('https://6E223.playfabapi.com/Lobby/FindLobbies');
    const options = fetchImpl.mock.calls[1][1] as RequestInit;
    expect(options.headers).toMatchObject({ 'X-EntityToken': 'entity-token' });
    expect(JSON.parse(String(options.body))).toMatchObject({
      Filter: "string_key10 eq '42.118.202.140:2456' and string_key2 eq 'True'",
    });
  });

  it('does not subtract a dedicated owner from player-hosted lobbies', () => {
    expect(ValheimPlayFabClient.playerCounts({
      CurrentPlayers: 2,
      MaxPlayers: 10,
      SearchData: { string_key7: 'False' },
    })).toEqual({ online: 2, total: 10 });
  });
});
