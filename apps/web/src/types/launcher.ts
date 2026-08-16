import type { ServerOnlineStatus } from './server';

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
  status: ServerOnlineStatus;
  requiredMods: LauncherPackageRef[];
  optionalMods: LauncherPackageRef[];
}

export interface LauncherServerManifest {
  schemaVersion: 1;
  generatedAt: string;
  servers: LauncherServer[];
}

export interface LauncherConnectResponse {
  schemaVersion: 1;
  serverId: string;
  host: string;
  port: number;
  password: string;
  fetchedAt: string;
}
