import { getGame } from '@/config/games';
import { getCs2LaunchUrl } from '@/lib/server-address';
import { parseServerMods } from '@/lib/server-mods';
import type { ServerMod } from '@/types/server';

const BLOCKED_PROTOCOLS = new Set(['javascript:', 'data:', 'file:', 'vbscript:']);

export interface GameServerInput {
  game: string;
  name: string;
  connectionLink: string | null;
  connectionHost: string | null;
  connectionPort: number | null;
  joinPassword: string | null;
  connectionGuide: string | null;
  description: string | null;
  metadataUrl: string | null;
  mods: ServerMod[];
}

export function parseGameServerInput(body: Record<string, unknown>): GameServerInput {
  const game = String(body.game || '').trim();
  const gameDefinition = getGame(game);
  const name = String(body.gameName || body.name || '').trim() || gameDefinition?.name || '';
  const connectionLink = String(body.connectionLink || '').trim() || null;
  const connectionHost = String(body.connectionHost || '').trim() || null;
  const rawConnectionPort = body.connectionPort === '' || body.connectionPort == null
    ? null
    : Number(body.connectionPort);
  const connectionPort = rawConnectionPort === null ? null : rawConnectionPort;
  const joinPassword = String(body.joinPassword || '').trim() || null;
  const connectionGuide = String(body.connectionGuide || '').trim() || null;
  const description = String(body.description || '').trim() || null;
  const metadataUrl = String(body.metadataUrl || '').trim() || null;
  const mods = parseServerMods(body.mods, game);

  if (!gameDefinition) {
    throw new Error('Please select a supported game');
  }

  if (!name) {
    throw new Error('Game name is required');
  }

  if (name.length > 255) {
    throw new Error('Game name must be 255 characters or fewer');
  }

  if (!connectionLink && !connectionGuide) {
    throw new Error('Add a connection link or connection guidance');
  }

  if (game === 'valheim') {
    if (!connectionHost || connectionPort === null || !joinPassword) {
      throw new Error('Valheim launcher host, port, and join password are required');
    }
    if (!isValidHost(connectionHost)) {
      throw new Error('Valheim launcher host must be a hostname or IP address');
    }
    if (!Number.isSafeInteger(connectionPort) || connectionPort < 1 || connectionPort > 65535) {
      throw new Error('Valheim launcher port must be between 1 and 65535');
    }
    if (joinPassword.length > 255) {
      throw new Error('Valheim join password must be 255 characters or fewer');
    }
  }

  if (connectionLink && connectionLink.length > 255) {
    throw new Error('Connection link must be 255 characters or fewer');
  }

  if (connectionGuide && connectionGuide.length > 10000) {
    throw new Error('Connection guidance must be 10,000 characters or fewer');
  }

  if (connectionLink) {
    const protocol = connectionLink.match(/^([a-z][a-z0-9+.-]*:)/i)?.[1].toLowerCase();
    if (protocol && BLOCKED_PROTOCOLS.has(protocol)) {
      throw new Error('Connection link uses an unsupported protocol');
    }
  }

  if (metadataUrl) {
    let url: URL;
    try {
      url = new URL(metadataUrl);
    } catch {
      throw new Error('Metadata URL must be a valid URL');
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Metadata URL must use HTTP or HTTPS');
    }
  }

  return {
    game,
    name,
    connectionLink,
    connectionHost: game === 'valheim' ? connectionHost : null,
    connectionPort: game === 'valheim' ? connectionPort : null,
    joinPassword: game === 'valheim' ? joinPassword : null,
    connectionGuide,
    description,
    metadataUrl,
    mods,
  };
}

function isValidHost(value: string) {
  return value.length <= 255
    && !value.includes('://')
    && !/[\s/?#]/.test(value)
    && !value.includes(':');
}

export function openConnectionLink(connectionLink: string | null, game: string, serverId?: string) {
  const launchUrl = getGameServerLaunchUrl(connectionLink, game, serverId);
  if (launchUrl) window.location.href = launchUrl;
}

export function getGameServerLaunchUrl(connectionLink: string | null, game: string, serverId?: string) {
  const link = connectionLink?.trim() || '';

  if (game === 'valheim') {
    return serverId && /^[1-9]\d*$/.test(serverId)
      ? `xomnghien://servers/${serverId}`
      : null;
  }

  if (!link) return null;

  if (game === 'cs2') {
    const cs2LaunchUrl = getCs2LaunchUrl(link);
    // CS2 reliably accepts +connect through its app-specific launch command.
    // steam://connect can open Steam without passing the address to CS2.
    if (cs2LaunchUrl) return cs2LaunchUrl;
  }

  if (game === 'palworld' && /^[^\s/:]+:\d+$/.test(link)) {
    return `steam://connect/${link}`;
  }

  const protocol = link.match(/^([a-z][a-z0-9+.-]*:)/i)?.[1].toLowerCase();
  if (protocol && !BLOCKED_PROTOCOLS.has(protocol)) {
    return link;
  }

  return link.startsWith('/') ? link : `https://${link}`;
}
