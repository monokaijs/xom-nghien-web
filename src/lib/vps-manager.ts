import {NodeSSH} from "node-ssh";
import {generateDockerCompose, generateCustomConfig, generateAdminConfig} from "@/lib/utils/composer";
import { GameMode, CS2Map } from '@/types/lobby';

export interface SpawnServerOptions {
  tempServerId: string;
  port: number;
  rconPassword: string;
  steamAccount: string;
  serverPassword?: string;
  mode?: GameMode;
  map?: CS2Map;
  admins?: string[];
}

export class VpsManager {
  host: string;
  port: number;
  username: string;
  privateKey: string;

  constructor(host: string, port: number, username: string, privateKey: string) {
    this.host = host;
    this.port = port;
    this.username = username;
    this.privateKey = privateKey;
  }

  async connect() {
    const ssh = new NodeSSH();
    await ssh.connect({
      host: this.host,
      port: this.port,
      username: this.username,
      privateKey: this.privateKey,
    });
    return ssh;
  }

  async withConnection<T>(fn: (ssh: NodeSSH) => Promise<T>): Promise<T> {
    const ssh = await this.connect();
    try {
      return await fn(ssh);
    } finally {
      ssh.dispose();
    }
  }

  async spawnNewServer(options: SpawnServerOptions) {
    const {
      tempServerId, port, rconPassword, steamAccount, mode = GameMode.Competitive, admins = [],
      serverPassword,
      map = CS2Map.Dust2,
    } = options;
    const rootPath = `~/temp-servers/${tempServerId}`;

    return this.withConnection(async (ssh) => {
      await ssh.execCommand(`mkdir -p ${rootPath}/ && cp ~/custom_files ${rootPath}/ -r`);

      const customConfig = generateCustomConfig(mode, map);
      await ssh.execCommand(`mkdir -p ${rootPath}/custom_files/${customConfig.path.split('/').slice(0, -1).join('/')}`);
      await ssh.execCommand(`cat > ${rootPath}/custom_files/${customConfig.path} << 'EOF'
${customConfig.content}
EOF`);

      const adminConfig = generateAdminConfig(admins);
      await ssh.execCommand(`mkdir -p ${rootPath}/custom_files/${adminConfig.path.split('/').slice(0, -1).join('/')}`);
      await ssh.execCommand(`cat > ${rootPath}/custom_files/${adminConfig.path} << 'EOF'
${adminConfig.content}
EOF`);

      const composeContent = generateDockerCompose({
        port,
        name: tempServerId,
        steamAccount: steamAccount || process.env.STEAM_ACCOUNT!,
        rconPassword,
        serverPassword,
        maxPlayer: 10,
        tickRate: 128,
        rootPath
      });

      await ssh.execCommand(`cat > ${rootPath}/docker-compose.yml << 'EOF'
${composeContent}
EOF`);

      const result = await ssh.execCommand(`cd ${rootPath} && docker compose up -d`);
      return { ...result, stdout: tempServerId };
    });
  }

  async stopServer(containerId: string) {
    return this.withConnection(async (ssh) => {
      return await ssh.execCommand(`docker stop ${containerId} && docker rm ${containerId}`);
    });
  }

  async shutdownServer(tempServerId: string, containerId: string) {
    const rootPath = `~/temp-servers/${tempServerId}`;
    return this.withConnection(async (ssh) => {
      await ssh.execCommand(`cd ${rootPath} && docker compose down 2>/dev/null || true`);
      await ssh.execCommand(`rm -rf ${rootPath}`);
      return { success: true };
    });
  }

  async getContainerStatus(containerId: string): Promise<boolean> {
    return this.withConnection(async (ssh) => {
      const result = await ssh.execCommand(`docker inspect -f '{{.State.Running}}' ${containerId} 2>/dev/null || echo "false"`);
      return result.stdout.trim() === 'true';
    });
  }

  async executeCommand(command: string) {
    return this.withConnection(async (ssh) => {
      return await ssh.execCommand(command);
    });
  }
}