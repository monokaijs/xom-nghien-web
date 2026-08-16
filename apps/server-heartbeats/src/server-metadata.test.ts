import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameDig } from 'gamedig';
import { queryServerMetadata } from './server-metadata.js';

vi.mock('gamedig', () => ({
  GameDig: {
    query: vi.fn(),
  },
}));

const query = vi.mocked(GameDig.query);

describe('queryServerMetadata', () => {
  beforeEach(() => {
    query.mockReset();
  });

  it('queries a non-crossplay Valheim server over Steam A2S', async () => {
    query.mockResolvedValue({
      name: 'XomNghien Valheim',
      map: 'XomNghien Valheim',
      numplayers: 3,
      maxplayers: 10,
      players: [
        { name: '', raw: { score: 0, time: 120 } },
        { name: '', raw: { score: 0, time: 60 } },
        { name: '', raw: { score: 0, time: 30 } },
      ],
      ping: 22,
    } as never);

    const metadata = await queryServerMetadata({
      id: 6,
      game: 'valheim',
      connectionLink: 'steam://run/892970//+connect%20game.example:2456%20+password%20secret',
      metadataUrl: null,
    });

    expect(query).toHaveBeenCalledWith({
      type: 'valheim',
      host: 'game.example',
      port: 2456,
      socketTimeout: 1_500,
      attemptTimeout: 3_000,
      maxRetries: 1,
    });
    expect(metadata).toMatchObject({
      status: 'online',
      players: { online: 3, total: 10, list: [] },
      map: null,
      ping: 22,
    });
    expect(metadata.queriedAt).not.toBeNull();
  });

  it('marks a Valheim server offline when its A2S query fails', async () => {
    query.mockRejectedValue(new Error('query timed out'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const metadata = await queryServerMetadata({
      id: 6,
      game: 'valheim',
      connectionLink: 'game.example:2456',
      metadataUrl: null,
    });

    expect(metadata).toMatchObject({
      status: 'offline',
      players: { online: 0, total: null, list: [] },
      map: null,
      ping: null,
    });
    consoleError.mockRestore();
  });
});
