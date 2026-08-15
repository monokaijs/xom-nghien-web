import { createHash, createSign } from 'node:crypto';
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

export interface SignedBootstrapManifest {
  algorithm: 'RS256';
  keyId: string;
  payload: string;
  signature: string;
}

export async function buildBootstrapManifest(
  serverId: string,
  mods: ServerMod[],
  configs: ServerManagedConfig[],
  options: { privateKey?: string; keyId?: string; generatedAt?: Date } = {},
): Promise<SignedBootstrapManifest> {
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
  const payload: BootstrapManifestPayload = {
    schemaVersion: 1,
    serverId,
    revision: createHash('sha256').update(revisionInput).digest('hex'),
    generatedAt: (options.generatedAt || new Date()).toISOString(),
    packages,
    configs: normalizedConfigs,
  };
  const payloadBytes = Buffer.from(JSON.stringify(payload), 'utf8');
  const privateKey = options.privateKey || bootstrapSigningPrivateKey();
  const signer = createSign('RSA-SHA256');
  signer.update(payloadBytes);
  signer.end();
  return {
    algorithm: 'RS256',
    keyId: options.keyId || process.env.XN_BOOTSTRAP_SIGNING_KEY_ID || 'xn-bootstrap-1',
    payload: payloadBytes.toString('base64'),
    signature: signer.sign(privateKey).toString('base64'),
  };
}

function bootstrapSigningPrivateKey() {
  const encoded = process.env.XN_BOOTSTRAP_SIGNING_PRIVATE_KEY_BASE64?.trim();
  const pem = encoded
    ? Buffer.from(encoded, 'base64').toString('utf8')
    : process.env.XN_BOOTSTRAP_SIGNING_PRIVATE_KEY?.replaceAll('\\n', '\n').trim();
  if (!pem) throw new Error('XN_BOOTSTRAP_SIGNING_PRIVATE_KEY is not configured');
  return pem;
}
