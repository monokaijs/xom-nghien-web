import { describe, expect, it } from 'vitest';
import { parseServerMods } from './server-mods';

const valheimMod = {
  provider: 'thunderstore',
  community: 'valheim',
  namespace: 'Azumatt',
  packageName: 'AzuCraftyBoxes',
  displayName: 'AzuCraftyBoxes',
  versionNumber: '1.8.0',
  description: 'Craft from nearby containers.',
  iconUrl: 'https://gcdn.thunderstore.io/live/repository/icons/example.png',
  packageUrl: 'https://malicious.example/ignored',
  requirement: 'required',
};

describe('parseServerMods', () => {
  it('keeps the exact package version and generates a canonical package URL', () => {
    expect(parseServerMods([valheimMod], 'valheim')).toEqual([{
      ...valheimMod,
      packageUrl: 'https://thunderstore.io/c/valheim/p/Azumatt/AzuCraftyBoxes/',
    }]);
  });

  it('rejects packages from a different game community', () => {
    expect(() => parseServerMods([{ ...valheimMod, community: 'palworld' }], 'valheim'))
      .toThrow("selected game's catalog");
  });

  it('rejects duplicate package identities regardless of casing', () => {
    expect(() => parseServerMods([
      valheimMod,
      { ...valheimMod, namespace: 'azumatt', packageName: 'azucraftyboxes' },
    ], 'valheim')).toThrow('added more than once');
  });

  it('rejects mods for games without a supported catalog', () => {
    expect(() => parseServerMods([valheimMod], 'cs2')).toThrow('does not have a supported mod catalog');
  });
});
