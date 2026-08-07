import { invoke as nativeInvoke } from '@tauri-apps/api/core';
import type { BootstrapData, CatalogPackage, LauncherConnection, ModUpdateInfo, ProfileDetails, ProfileImportPreview, ProfileSummary, ProfileUpdateCheck } from './types';

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
    language: 'vi', downloadConcurrency: 4, launchArguments: '', minimizeOnLaunch: true,
    checkForUpdates: false, logLevel: 'info',
  },
  firstRun: true,
  detectedGamePath: '/Applications/Valheim.app/Contents/MacOS/valheim',
  appVersion: '0.1.0-preview',
  servers: [{
    id: '1', name: 'Xóm Nghiện Valheim', game: 'valheim', host: 'valheim.xomnghien.com', port: 2456,
    description: 'Community survival server with a carefully selected mod pack.', status: 'online',
    requiredMods: [previewMod], optionalMods: [{ ...previewMod, namespace: 'Azumatt', packageName: 'AzuCraftyBoxes', displayName: 'AzuCraftyBoxes', versionNumber: '1.8.0', requirement: 'optional' }], selectedOptionalPackages: [],
  }],
  profiles: [
    { id: 'server-1', name: 'Xóm Nghiện Valheim', kind: 'server', serverId: '1', directModCount: 6, dependencyCount: 2, syncState: 'ready', updatedAt: new Date().toISOString() },
    { id: 'personal-preview', name: 'Solo Adventure', kind: 'personal', serverId: null, directModCount: 1, dependencyCount: 0, syncState: 'pending', updatedAt: new Date().toISOString() },
  ],
};

const previewCatalog: CatalogPackage[] = [{
  namespace: 'Azumatt', name: 'AzuCraftyBoxes', fullName: 'Azumatt-AzuCraftyBoxes',
  description: 'Craft and build from nearby containers.', iconUrl: '', versionNumber: '1.8.0',
  downloadCount: 325000, isDeprecated: false,
}];

export async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if ('__TAURI_INTERNALS__' in window) return nativeInvoke<T>(command, args);
  if (command === 'bootstrap') return previewData as T;
  if (command === 'server_connection') return {
    schemaVersion: 1, serverId: '1', host: 'valheim.xomnghien.com', port: 2456,
    password: 'xomnghien', fetchedAt: new Date().toISOString(),
  } as LauncherConnection as T;
  if (command === 'open_external_url') {
    const url = String(args?.url || '');
    window.open(url, '_blank', 'noopener,noreferrer');
    return undefined as T;
  }
  if (command === 'search_mods') return previewCatalog as T;
  if (command === 'profile_details' || command === 'add_profile_mod' || command === 'set_package_enabled' || command === 'set_profile_auto_update' || command === 'remove_package' || command === 'sync_profile' || command === 'update_profile_mod' || command === 'update_profile_mods') return {
    metadata: { id: 'personal-preview', name: 'Solo Adventure', kind: 'personal', serverId: null, autoUpdate: false, requestedPackages: [{ coordinate: 'Azumatt-AzuCraftyBoxes-1.8.0', origin: 'extra', enabled: true }] },
    lock: { generatedAt: new Date().toISOString(), requestedPackages: [], packages: {} },
    directModCount: 1,
    dependencyCount: 0,
    syncState: 'pending',
  } as ProfileDetails as T;
  if (command === 'check_profile_mod_updates') return {
    profileId: 'personal-preview', checkedAt: new Date().toISOString(), updates: [{
      coordinate: 'Azumatt-AzuCraftyBoxes-1.8.0', namespace: 'Azumatt', name: 'AzuCraftyBoxes',
      currentVersion: '1.8.0', latestVersion: '1.9.0', latestCoordinate: 'Azumatt-AzuCraftyBoxes-1.9.0',
      updateAvailable: true, isDeprecated: false,
    }],
  } as ProfileUpdateCheck as T;
  if (command === 'check_mod_update') return {
    coordinate: 'Azumatt-AzuCraftyBoxes-1.8.0', namespace: 'Azumatt', name: 'AzuCraftyBoxes',
    currentVersion: '1.8.0', latestVersion: '1.9.0', latestCoordinate: 'Azumatt-AzuCraftyBoxes-1.9.0',
    updateAvailable: true, isDeprecated: false,
  } as ModUpdateInfo as T;
  if (command === 'create_profile' || command === 'rename_profile' || command === 'import_profile' || command === 'install_vietnamese_translation') return {
    id: 'personal-preview', name: String(args?.name || 'Solo Adventure'), kind: 'personal', serverId: null,
    directModCount: 0, dependencyCount: 0, syncState: 'notInstalled', updatedAt: null,
  } as ProfileSummary as T;
  if (command === 'inspect_profile_import') return {
    profileName: 'Friends', suggestedName: 'Friends', blockingError: null,
    mods: [{ coordinate: 'Azumatt-AzuCraftyBoxes-1.8.0', enabled: true, available: true, deprecated: false }],
  } as ProfileImportPreview as T;
  if (command === 'available_update') return null as T;
  return undefined as T;
}
