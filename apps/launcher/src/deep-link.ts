const SERVER_LINK_PROTOCOL = 'xomnghien:';
const SERVER_LINK_HOST = 'servers';

export function parseServerDeepLink(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (
    url.protocol !== SERVER_LINK_PROTOCOL
    || url.hostname !== SERVER_LINK_HOST
    || url.username
    || url.password
    || url.port
    || url.search
    || url.hash
  ) return null;

  const match = url.pathname.match(/^\/([1-9]\d*)\/?$/);
  if (!match) return null;
  const serverId = Number(match[1]);
  return Number.isSafeInteger(serverId) ? String(serverId) : null;
}
