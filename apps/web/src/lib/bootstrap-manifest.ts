import { createHash } from 'node:crypto';
import { resolveThunderstorePackages, type ResolvedThunderstorePackage } from '@/lib/thunderstore';
import type { ServerManagedConfig, ServerMod } from '@/types/server';

export interface BootstrapManifestPayload {
  schemaVersion: 1;
  serverId: string;
  revision: string;
  generatedAt: string;
  packages: ResolvedThunderstorePackage[];
  configs: Array<{
    path: string;
    sha256: string;
    contentBase64: string;
  }>;
}

export async function buildBootstrapManifest(
  serverId: string,
  mods: ServerMod[],
  configs: ServerManagedConfig[],
  options: { generatedAt?: Date } = {},
): Promise<BootstrapManifestPayload> {
  const required = mods.filter((mod) => mod.requirement === 'required');
  const communities = new Set(required.map((mod) => mod.community));
  if (communities.size > 1) throw new Error('Bootstrap packages must belong to one Thunderstore community');
  const community = [...communities][0] || 'valheim';
  const coordinates = required.map((mod) => `${mod.namespace}-${mod.packageName}-${mod.versionNumber}`);
  const packages = await resolveThunderstorePackages(community, coordinates);
  const normalizedConfigs = configs
    .map((config) => ({
      path: config.path,
      sha256: config.sha256 || createHash('sha256').update(config.contents, 'utf8').digest('hex'),
      contentBase64: Buffer.from(config.contents, 'utf8').toString('base64'),
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const revisionInput = JSON.stringify({
    packages: packages.map((item) => item.coordinate),
    configs: normalizedConfigs.map((item) => ({ path: item.path, sha256: item.sha256 })),
  });
  return {
    schemaVersion: 1,
    serverId,
    revision: createHash('sha256').update(revisionInput).digest('hex'),
    generatedAt: (options.generatedAt || new Date()).toISOString(),
    packages,
    configs: normalizedConfigs,
  };
}
