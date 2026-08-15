import { describe, expect, it } from 'vitest';
import { parseServerManagedConfigs } from './server-managed-configs';

describe('parseServerManagedConfigs', () => {
  it('normalizes paths and hashes the exact UTF-8 contents', () => {
    expect(parseServerManagedConfigs([{
      path: 'BepInEx\\config\\Author.Mod.cfg',
      contents: 'Enabled = true\n',
    }], 'valheim')).toEqual([{
      path: 'Author.Mod.cfg',
      contents: 'Enabled = true\n',
      sha256: 'd3d20ba2fd9a4392c710ee02a1510b47a80745aa1fb5419de492b1f7e8915cca',
    }]);
  });

  it('rejects traversal and executable files', () => {
    expect(() => parseServerManagedConfigs([{ path: '../evil.cfg', contents: '' }], 'valheim')).toThrow('safe relative paths');
    expect(() => parseServerManagedConfigs([{ path: 'evil.dll', contents: '' }], 'valheim')).toThrow('safe relative paths');
    expect(() => parseServerManagedConfigs([{ path: 'bad:name.cfg', contents: '' }], 'valheim')).toThrow('safe relative paths');
  });

  it('rejects duplicate paths case-insensitively', () => {
    expect(() => parseServerManagedConfigs([
      { path: 'Mod.cfg', contents: 'one' },
      { path: 'mod.cfg', contents: 'two' },
    ], 'valheim')).toThrow('more than once');
  });
});
