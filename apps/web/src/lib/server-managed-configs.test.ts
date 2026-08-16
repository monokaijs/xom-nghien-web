import { describe, expect, it } from 'vitest';
import { parseServerManagedConfigs } from './server-managed-configs';

const mods = [{
  provider: 'thunderstore' as const,
  community: 'valheim',
  namespace: 'Author',
  packageName: 'Mod',
  displayName: 'Mod',
  versionNumber: '1.0.0',
  description: null,
  iconUrl: null,
  packageUrl: 'https://thunderstore.io/c/valheim/p/Author/Mod/',
  requirement: 'required' as const,
}];

describe('parseServerManagedConfigs', () => {
  it('normalizes paths and hashes the exact UTF-8 contents', () => {
    expect(parseServerManagedConfigs([{
      modProvider: 'thunderstore',
      modNamespace: 'author',
      modPackageName: 'mod',
      sourceVersion: '1.0.0',
      path: 'BepInEx\\config\\Author.Mod.cfg',
      contents: 'Enabled = true\n',
      target: 'server',
    }], 'valheim', mods)).toEqual([{
      modProvider: 'thunderstore',
      modNamespace: 'Author',
      modPackageName: 'Mod',
      sourceVersion: '1.0.0',
      path: 'Author.Mod.cfg',
      contents: 'Enabled = true\n',
      sha256: 'd3d20ba2fd9a4392c710ee02a1510b47a80745aa1fb5419de492b1f7e8915cca',
      target: 'server',
    }]);
  });

  it('rejects traversal and executable files', () => {
    const owner = { modProvider: 'thunderstore', modNamespace: 'Author', modPackageName: 'Mod' };
    expect(() => parseServerManagedConfigs([{ ...owner, path: '../evil.cfg', contents: '' }], 'valheim', mods)).toThrow('safe relative paths');
    expect(() => parseServerManagedConfigs([{ ...owner, path: 'evil.dll', contents: '' }], 'valheim', mods)).toThrow('safe relative paths');
    expect(() => parseServerManagedConfigs([{ ...owner, path: 'bad:name.cfg', contents: '' }], 'valheim', mods)).toThrow('safe relative paths');
  });

  it('rejects duplicate paths case-insensitively', () => {
    expect(() => parseServerManagedConfigs([
      { modProvider: 'thunderstore', modNamespace: 'Author', modPackageName: 'Mod', path: 'Mod.cfg', contents: 'one' },
      { modProvider: 'thunderstore', modNamespace: 'Author', modPackageName: 'Mod', path: 'mod.cfg', contents: 'two' },
    ], 'valheim', mods)).toThrow('more than once');
  });

  it('rejects configs whose owning mod is not selected', () => {
    expect(() => parseServerManagedConfigs([{
      modProvider: 'thunderstore', modNamespace: 'Other', modPackageName: 'Mod', path: 'Other.Mod.cfg', contents: '',
    }], 'valheim', mods)).toThrow('must belong to a selected mod');
  });
});
