import path from 'path';
import { NodeSSH, type SSHExecCommandResponse } from 'node-ssh';
import SftpClient from 'ssh2-sftp-client';
import type { ServerHost } from '@xom/db';
import { decryptSecret } from '@xom/db/crypto';
import type { RemoteFile } from './types';

export interface SshHostConfig {
  sshHost: string;
  sshPort: number;
  sshUsername: string;
  privateKey: string;
}

export function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function remotePathJoin(basePath: string, relativePath: string) {
  if (!relativePath || relativePath.startsWith('/') || relativePath.includes('..')) {
    throw new Error(`Unsafe remote path: ${relativePath}`);
  }

  return path.posix.join(basePath, relativePath);
}

export function getSshConfig(host: ServerHost): SshHostConfig {
  return {
    sshHost: host.sshHost,
    sshPort: host.sshPort,
    sshUsername: host.sshUsername,
    privateKey: decryptSecret(host.encryptedPrivateKey),
  };
}

export class RemoteDockerHost {
  private ssh: NodeSSH | null = null;

  constructor(private readonly config: SshHostConfig) {}

  async connect() {
    if (this.ssh) return;
    this.ssh = new NodeSSH();
    await this.ssh.connect({
      host: this.config.sshHost,
      port: this.config.sshPort,
      username: this.config.sshUsername,
      privateKey: this.config.privateKey,
      readyTimeout: 15000,
    });
  }

  async exec(command: string): Promise<SSHExecCommandResponse> {
    await this.connect();
    const result = await this.ssh!.execCommand(command);
    if (result.code && result.code !== 0) {
      throw new Error(result.stderr || result.stdout || `Command failed: ${command}`);
    }
    return result;
  }

  async resolveBasePath(basePath: string) {
    if (basePath === '~') {
      const result = await this.exec('printf "%s" "$HOME"');
      return result.stdout.trim();
    }
    if (basePath.startsWith('~/')) {
      const suffix = basePath.slice(2).replace(/^\/+/, '');
      const result = await this.exec(`printf "%s/%s" "$HOME" ${shellQuote(suffix)}`);
      return result.stdout.trim();
    }
    return basePath;
  }

  async uploadFiles(basePath: string, files: RemoteFile[]) {
    await this.connect();
    const sftp = new SftpClient();
    await sftp.connect({
      host: this.config.sshHost,
      port: this.config.sshPort,
      username: this.config.sshUsername,
      privateKey: this.config.privateKey,
    });

    try {
      for (const file of files) {
        const remotePath = remotePathJoin(basePath, file.path);
        const remoteDir = path.posix.dirname(remotePath);
        await this.exec(`mkdir -p ${shellQuote(remoteDir)}`);
        await sftp.put(Buffer.from(file.content, 'utf8'), remotePath);
      }
    } finally {
      await sftp.end();
    }
  }

  async dispose() {
    this.ssh?.dispose();
    this.ssh = null;
  }
}

export async function validateSshAndDocker(config: SshHostConfig) {
  const remote = new RemoteDockerHost(config);
  try {
    await remote.exec('docker --version');
    await remote.exec('docker compose version');
  } finally {
    await remote.dispose();
  }
}
