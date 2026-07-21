export interface ParsedServerAddress {
  host: string;
  port: number;
  address: string;
}

const STEAM_CONNECT_PREFIX = /^steam:\/\/connect\//i;
const STEAM_RUN_PREFIX = /^steam:\/\/(?:run|rungameid)\/730\//i;

function decodeSteamCommand(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseAddress(value: string): ParsedServerAddress | null {
  const bracketed = value.match(/^\[([^\]]+)]:(\d{1,5})$/);
  const regular = value.match(/^([^\s/:]+):(\d{1,5})$/);
  const match = bracketed || regular;
  if (!match) return null;

  const host = match[1].trim();
  const port = Number(match[2]);
  if (!host || !Number.isInteger(port) || port < 1 || port > 65_535) return null;

  return {
    host,
    port,
    address: host.includes(':') ? `[${host}]:${port}` : `${host}:${port}`,
  };
}

/**
 * Extracts the query address from the formats accepted by the server editor.
 * In particular, URL cannot parse steam://connect/host:port as expected because
 * it treats "connect" as the hostname, so Steam links are handled explicitly.
 */
export function parseServerAddress(connectionLink: string): ParsedServerAddress | null {
  const link = connectionLink.trim();
  if (!link) return null;

  if (STEAM_CONNECT_PREFIX.test(link)) {
    const remainder = link.replace(STEAM_CONNECT_PREFIX, '');
    return parseAddress(remainder.split(/[/?#]/, 1)[0]);
  }

  if (STEAM_RUN_PREFIX.test(link)) {
    const command = decodeSteamCommand(link);
    const connectArgument = command.match(/(?:^|[\s/;])\+?connect\s+([^\s;/]+)/i)?.[1];
    return connectArgument ? parseAddress(connectArgument) : null;
  }

  // A plain host:port is also accepted by the server editor.
  if (!link.includes('://')) return parseAddress(link);
  return null;
}

export function getCs2LaunchUrl(connectionLink: string): string | null {
  const server = parseServerAddress(connectionLink);
  return server ? `steam://run/730//+connect ${server.address}` : null;
}
