import type { PortProtocol } from '@xom/game-config';

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

export interface RenderContext<TConfig> {
  config: TConfig;
  projectName: string;
  containerName: string;
  hostPublicAddress: string;
  portBindings: PortBinding[];
  credentialValue?: string;
  rconPassword: string;
}

export interface RenderedGameServer {
  files: RemoteFile[];
  composeFile: string;
  connectAddress: string;
  queryPort: number;
}
