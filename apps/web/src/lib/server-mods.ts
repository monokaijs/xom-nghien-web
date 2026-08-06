import { getModCatalog } from '../config/games';
import type { ServerMod, ServerModRequirement } from '../types/server';

const PACKAGE_PART = /^[A-Za-z0-9_]+$/;
const VERSION_NUMBER = /^[0-9A-Za-z][0-9A-Za-z.+_-]{0,63}$/;
const MAX_MODS_PER_SERVER = 100;

export function parseServerMods(value: unknown, game: string): ServerMod[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error('Mods must be a list');
  if (value.length > MAX_MODS_PER_SERVER) {
    throw new Error(`A server can have at most ${MAX_MODS_PER_SERVER} mods`);
  }

  const catalog = getModCatalog(game);
  if (!catalog && value.length > 0) throw new Error('The selected game does not have a supported mod catalog');

  const seen = new Set<string>();
  return value.map((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error(`Mod ${index + 1} is invalid`);
    }

    const record = raw as Record<string, unknown>;
    const provider = String(record.provider || '');
    const community = String(record.community || '');
    const namespace = String(record.namespace || '');
    const packageName = String(record.packageName || '');
    const displayName = String(record.displayName || '').trim();
    const versionNumber = String(record.versionNumber || '');
    const description = String(record.description || '').trim().slice(0, 2000) || null;
    const iconUrl = String(record.iconUrl || '').trim() || null;
    const requirement = String(record.requirement || '') as ServerModRequirement;

    if (provider !== 'thunderstore' || catalog?.provider !== provider || catalog.community !== community) {
      throw new Error(`Mod ${index + 1} is not from the selected game's catalog`);
    }
    if (!PACKAGE_PART.test(namespace) || !PACKAGE_PART.test(packageName)) {
      throw new Error(`Mod ${index + 1} has an invalid package identifier`);
    }
    if (!displayName || displayName.length > 255) {
      throw new Error(`Mod ${index + 1} has an invalid display name`);
    }
    if (!VERSION_NUMBER.test(versionNumber)) {
      throw new Error(`Mod ${index + 1} has an invalid version`);
    }
    if (requirement !== 'required' && requirement !== 'optional') {
      throw new Error(`Mod ${index + 1} must be required or optional`);
    }
    if (iconUrl && !isThunderstoreUrl(iconUrl)) {
      throw new Error(`Mod ${index + 1} has an invalid icon URL`);
    }

    const key = `${provider}:${namespace.toLowerCase()}/${packageName.toLowerCase()}`;
    if (seen.has(key)) throw new Error(`${displayName} was added more than once`);
    seen.add(key);

    return {
      provider,
      community,
      namespace,
      packageName,
      displayName,
      versionNumber,
      description,
      iconUrl,
      packageUrl: `https://thunderstore.io/c/${community}/p/${namespace}/${packageName}/`,
      requirement,
    };
  });
}

export function toServerMod(record: {
  provider: string;
  community: string;
  namespace: string;
  packageName: string;
  displayName: string;
  versionNumber: string;
  description: string | null;
  iconUrl: string | null;
  packageUrl: string;
  requirement: string;
}): ServerMod {
  return {
    provider: record.provider as ServerMod['provider'],
    community: record.community,
    namespace: record.namespace,
    packageName: record.packageName,
    displayName: record.displayName,
    versionNumber: record.versionNumber,
    description: record.description,
    iconUrl: record.iconUrl,
    packageUrl: record.packageUrl,
    requirement: record.requirement as ServerModRequirement,
  };
}

function isThunderstoreUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && (url.hostname === 'thunderstore.io' || url.hostname.endsWith('.thunderstore.io'));
  } catch {
    return false;
  }
}
