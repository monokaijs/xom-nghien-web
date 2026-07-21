import { getGame } from '@/config/games';
import { getCs2LaunchUrl } from '@/lib/server-address';

const BLOCKED_PROTOCOLS = new Set(['javascript:', 'data:', 'file:', 'vbscript:']);

export interface GameServerInput {
  game: string;
  name: string;
  connectionLink: string | null;
  connectionGuide: string | null;
  description: string | null;
  metadataUrl: string | null;
}

export function parseGameServerInput(body: Record<string, unknown>): GameServerInput {
  const game = String(body.game || '').trim();
  const gameDefinition = getGame(game);
  const name = String(body.gameName || body.name || '').trim() || gameDefinition?.name || '';
  const connectionLink = String(body.connectionLink || '').trim() || null;
  const connectionGuide = String(body.connectionGuide || '').trim() || null;
  const description = String(body.description || '').trim() || null;
  const metadataUrl = String(body.metadataUrl || '').trim() || null;

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
    connectionGuide,
    description,
    metadataUrl,
  };
}

export function openConnectionLink(connectionLink: string, game: string) {
  const link = connectionLink.trim();

  if (game === 'cs2') {
    const cs2LaunchUrl = getCs2LaunchUrl(link);
    if (cs2LaunchUrl) {
      // CS2 reliably accepts +connect through its app-specific launch command.
      // steam://connect can open Steam without passing the address to CS2.
      window.location.href = cs2LaunchUrl;
      return;
    }
  }

  if ((game === 'palworld' || game === 'valheim') && /^[^\s/:]+:\d+$/.test(link)) {
    window.location.href = `steam://connect/${link}`;
    return;
  }

  const protocol = link.match(/^([a-z][a-z0-9+.-]*:)/i)?.[1].toLowerCase();
  if (protocol && !BLOCKED_PROTOCOLS.has(protocol)) {
    window.location.href = link;
    return;
  }

  window.location.href = link.startsWith('/') ? link : `https://${link}`;
}
