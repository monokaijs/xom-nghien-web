export type Locale = 'en' | 'vi';
export type Page = 'servers' | 'profiles' | 'settings';
export type ProfileSyncState = 'notInstalled' | 'pending' | 'ready';

export interface LauncherPackageRef {
  provider: 'thunderstore';
  community: string;
  namespace: string;
  packageName: string;
  displayName: string;
  versionNumber: string;
  description: string | null;
  iconUrl: string | null;
  packageUrl: string;
  requirement: 'required' | 'optional';
}

export interface LauncherServer {
  id: string;
  name: string;
  game: 'valheim';
  host: string;
  port: number;
  description: string | null;
  status: 'online' | 'offline' | 'unknown';
  requiredMods: LauncherPackageRef[];
  optionalMods: LauncherPackageRef[];
  selectedOptionalPackages: string[];
}

export interface LauncherConnection {
  schemaVersion: number;
  serverId: string;
  host: string;
  port: number;
  password: string;
  fetchedAt: string;
}

export interface ProfileSummary {
  id: string;
  name: string;
  kind: 'server' | 'personal';
  serverId: string | null;
  directModCount: number;
  dependencyCount: number;
  syncState: ProfileSyncState;
  updatedAt: string | null;
}

export interface RequestedPackage {
  coordinate: string;
  origin: 'required' | 'optional' | 'extra' | 'runtime' | string;
  enabled: boolean;
}

export interface ProfileDetails {
  metadata: {
    id: string;
    name: string;
    kind: 'server' | 'personal';
    serverId: string | null;
    requestedPackages: RequestedPackage[];
  };
  lock: {
    generatedAt: string;
    requestedPackages: RequestedPackage[];
    packages: Record<string, {
      coordinate: string;
      namespace: string;
      name: string;
      version: string;
      dependencies: string[];
      origins: string[];
      enabled: boolean;
    }>;
  } | null;
  directModCount: number;
  dependencyCount: number;
  syncState: ProfileSyncState;
}

export interface CatalogPackage {
  namespace: string;
  name: string;
  fullName: string;
  description: string;
  iconUrl: string;
  versionNumber: string;
  downloadCount: number;
  isDeprecated: boolean;
}

export interface ProfileImportMod {
  coordinate: string;
  enabled: boolean;
  available: boolean;
  deprecated: boolean;
}

export interface ProfileImportPreview {
  profileName: string;
  suggestedName: string;
  mods: ProfileImportMod[];
  blockingError: string | null;
}

export interface LauncherSettings {
  apiBaseUrl: string;
  gamePath: string | null;
  language: Locale;
  downloadConcurrency: number;
  launchArguments: string;
  minimizeOnLaunch: boolean;
  checkForUpdates: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface BootstrapData {
  settings: LauncherSettings;
  detectedGamePath: string | null;
  servers: LauncherServer[];
  profiles: ProfileSummary[];
  appVersion: string;
}
