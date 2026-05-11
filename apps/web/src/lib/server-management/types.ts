import type { PortProtocol, PortRequest } from '@xom/game-config';

export type ServerInstanceStatus =
  | 'queued'
  | 'provisioning'
  | 'online'
  | 'offline'
  | 'starting'
  | 'stopping'
  | 'restarting'
  | 'failed'
  | 'deleting'
  | 'deleted';

export type ServerJobType = 'provision' | 'start' | 'stop' | 'restart' | 'delete' | 'retry' | 'sync-status';
export type { PortProtocol, PortRequest };

export interface PortBinding {
  name: string;
  hostPort: number;
  containerPort: number;
  protocol: PortProtocol;
}

export interface RemoteFile {
  path: string;
  content: string;
}

export function sanitizeDockerName(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return normalized || 'game-server';
}
