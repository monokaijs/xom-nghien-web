import { invoke as nativeInvoke } from '@tauri-apps/api/core';
import type { BootstrapData, CatalogPackage, ProfileDetails } from './types';

const previewMod = {
  provider: 'thunderstore' as const,
  community: 'valheim',
  namespace: 'denikson',
  packageName: 'BepInExPack_Valheim',
  displayName: 'BepInExPack Valheim',
  versionNumber: '5.4.2333',
  description: 'BepInEx pack for Valheim.',
  iconUrl: null,
  packageUrl: 'https://thunderstore.io/c/valheim/p/denikson/BepInExPack_Valheim/',
  requirement: 'required' as const,
};

const previewData: BootstrapData = {
  settings: {
    apiBaseUrl: 'https://xomnghien.com', gamePath: '/Applications/Valheim.app/Contents/MacOS/valheim',
    language: 'en', downloadConcurrency: 4, launchArguments: '', minimizeOnLaunch: true,
    checkForUpdates: false, logLevel: 'info',
  },
  detectedGamePath: '/Applications/Valheim.app/Contents/MacOS/valheim',
  appVersion: '0.1.0-preview',
  servers: [{
    id: '1', name: 'Xóm Nghiện Valheim', game: 'valheim', host: 'valheim.xomnghien.com', port: 2456,
    description: 'Community survival server with a carefully selected mod pack.', status: 'online',
    requiredMods: [previewMod], optionalMods: [{ ...previewMod, namespace: 'Azumatt', packageName: 'AzuCraftyBoxes', displayName: 'AzuCraftyBoxes', versionNumber: '1.8.0', requirement: 'optional' }], selectedOptionalPackages: [],
  }],
  profiles: [{ id: 'server-1', name: 'Xóm Nghiện Valheim', kind: 'server', serverId: '1', packageCount: 6, updatedAt: new Date().toISOString() }],
};

const previewCatalog: CatalogPackage[] = [{
  namespace: 'Azumatt', name: 'AzuCraftyBoxes', fullName: 'Azumatt-AzuCraftyBoxes',
  description: 'Craft and build from nearby containers.', iconUrl: '', versionNumber: '1.8.0',
  downloadCount: 325000, isDeprecated: false,
}];

export async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if ('__TAURI_INTERNALS__' in window) return nativeInvoke<T>(command, args);
  if (command === 'bootstrap') return previewData as T;
  if (command === 'search_mods') return previewCatalog as T;
  if (command === 'profile_details') return {
    metadata: { id: 'server-1', name: 'Xóm Nghiện Valheim', kind: 'server', serverId: '1', requestedPackages: [{ coordinate: previewMod.namespace + '-' + previewMod.packageName + '-' + previewMod.versionNumber, origin: 'required', enabled: true }] },
    lock: null,
  } as ProfileDetails as T;
  if (command === 'available_update') return null as T;
  return undefined as T;
}
