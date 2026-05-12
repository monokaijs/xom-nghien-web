import type { Cs2EnvValue, Cs2ServerConfig } from '@xom/game-config';
import {
  CS2_BOOT_EXEC_FILE,
  renderCs2CustomFiles,
  validateCs2Config,
} from '@xom/game-config';
import type { PortBinding, RenderContext, RenderedGameServer } from '../server/types';

function firstBinding(bindings: PortBinding[], name: string) {
  const binding = bindings.find((port) => port.name === name);
  if (!binding) throw new Error(`Missing ${name} port binding`);
  return binding;
}

function formatEnvValue(value: Cs2EnvValue) {
  if (typeof value === 'boolean') return value ? '1' : '0';
  return String(value);
}

function renderCompose(ctx: RenderContext<Cs2ServerConfig>) {
  const gamePort = firstBinding(ctx.portBindings, 'game');
  const apiKey = process.env.STEAM_WEB_API_KEY || process.env.STEAM_API_KEY || '';
  const env: Record<string, Cs2EnvValue> = {
    TICKRATE: ctx.config.tickRate,
    MAXPLAYERS: ctx.config.maxPlayers,
    API_KEY: apiKey,
    STEAM_ACCOUNT: ctx.credentialValue || '',
    RCON_PASSWORD: ctx.rconPassword,
    EXEC: CS2_BOOT_EXEC_FILE,
    CUSTOM_FOLDER: 'custom_files',
    ...ctx.config.env,
  };

  if (ctx.config.serverPassword) {
    env.SERVER_PASSWORD = ctx.config.serverPassword;
  }

  const envLines = Object.entries(env)
    .map(([key, value]) => `      ${key}: "${formatEnvValue(value).replace(/"/g, '\\"')}"`)
    .join('\n');

  return `services:
  ${ctx.projectName}:
    image: cs2-modded-server
    container_name: ${ctx.containerName}
    pull_policy: never
    user: "1000:1000"
    environment:
${envLines}
    volumes:
      - ${ctx.projectName}-home:/home/steam:rw
      - ./custom_files:/home/custom_files:ro
    ports:
      - "${gamePort.hostPort}:27015/tcp"
      - "${gamePort.hostPort}:27015/udp"
    cpu_count: 4
    mem_reservation: 8000m
    networks:
      - cs2_game-net
    restart: unless-stopped

networks:
  cs2_game-net:
    external: true

volumes:
  ${ctx.projectName}-home:
`;
}

export const cs2SpawnerAdapter = {
  key: 'cs2',
  validateConfig: validateCs2Config,
  render(ctx: RenderContext<Cs2ServerConfig>): RenderedGameServer {
    const gamePort = firstBinding(ctx.portBindings, 'game');
    const composeFile = renderCompose(ctx);

    return {
      composeFile,
      connectAddress: `${ctx.hostPublicAddress}:${gamePort.hostPort}`,
      queryPort: gamePort.hostPort,
      files: [
        {
          path: 'docker-compose.yml',
          content: composeFile,
        },
        ...renderCs2CustomFiles(ctx.config).map((file) => ({
          path: `custom_files/${file.path}`,
          content: file.content,
        })),
      ],
    };
  },
};
