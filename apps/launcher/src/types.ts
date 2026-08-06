export type Locale = 'en' | 'vi';
export type Page = 'servers' | 'profiles' | 'browse' | 'downloads' | 'settings';

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

export interface ProfileSummary {
  id: string;
  name: string;
  kind: 'server' | 'personal';
  serverId: string | null;
  packageCount: number;
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
    packages: Record<string, { coordinate: string; origins: string[] }>;
  } | null;
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
