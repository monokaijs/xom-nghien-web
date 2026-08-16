import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildBootstrapManifest } from './bootstrap-manifest';
import type { ServerMod } from '@/types/server';

afterEach(() => vi.unstubAllGlobals());

describe('buildBootstrapManifest', () => {
  it('resolves dependencies and embeds configs in a plain manifest', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([
      packageEntry('Author', 'MainMod', '1.0.0', ['Library-SharedLib-2.0.0']),
      packageEntry('Library', 'SharedLib', '2.0.0', []),
    ]))));
    const mod: ServerMod = {
      provider: 'thunderstore', community: 'bootstrap-test', namespace: 'Author', packageName: 'MainMod',
      displayName: 'Main Mod', versionNumber: '1.0.0', description: null, iconUrl: null,
      packageUrl: 'https://thunderstore.io/c/bootstrap-test/p/Author/MainMod/', requirement: 'required',
    };

    const manifest = await buildBootstrapManifest('42', [mod], [{
      modProvider: 'thunderstore', modNamespace: 'Author', modPackageName: 'MainMod', sourceVersion: '1.0.0',
      path: 'Author.MainMod.cfg', contents: 'Enabled = true\n', target: 'server',
    }], { generatedAt: new Date('2026-08-16T00:00:00Z') });

    expect(manifest.packages.map((item: { coordinate: string }) => item.coordinate)).toEqual([
      'Author-MainMod-1.0.0',
      'Library-SharedLib-2.0.0',
    ]);
    expect(Buffer.from(manifest.configs[0].contentBase64, 'base64').toString('utf8')).toBe('Enabled = true\n');
    expect(manifest).toMatchObject({ schemaVersion: 2, manifestId: '42' });
    expect(manifest.configs[0].target).toBe('server');
    expect(manifest.revision).not.toBe(manifest.clientRevision);
  });
});

function packageEntry(owner: string, name: string, version: string, dependencies: string[]) {
  return {
    name, owner, package_url: `https://thunderstore.io/c/bootstrap-test/p/${owner}/${name}/`, rating_score: 0,
    is_pinned: false, is_deprecated: false, has_nsfw_content: false,
    versions: [{
      name, description: '', icon: '', version_number: version, downloads: 0, is_active: true,
      dependencies, download_url: `https://gcdn.thunderstore.io/live/repository/packages/${owner}-${name}-${version}.zip`, file_size: 123,
    }],
  };
}
