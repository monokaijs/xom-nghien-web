import type { Cs2Mode, Cs2ServerConfig } from '@xom/game-config';
import { validateCs2Config } from '@xom/game-config';
import type { PortBinding, RenderContext, RenderedGameServer } from '../server/types';

const MODE_CONFIG_FILE: Record<Cs2Mode, string> = {
  competitive: 'comp.cfg',
  wingman: 'wingman.cfg',
  deathmatch: 'dm.cfg',
  '1v1': '1v1.cfg',
  gg: 'gg.cfg',
};

function firstBinding(bindings: PortBinding[], name: string) {
  const binding = bindings.find((port) => port.name === name);
  if (!binding) throw new Error(`Missing ${name} port binding`);
  return binding;
}

function renderCompose(ctx: RenderContext<Cs2ServerConfig>) {
  const gamePort = firstBinding(ctx.portBindings, 'game');
  const apiKey = process.env.STEAM_WEB_API_KEY || process.env.STEAM_API_KEY || '';
  const env: Record<string, string | number> = {
    TICKRATE: ctx.config.tickRate,
    MAXPLAYERS: ctx.config.maxPlayers,
    API_KEY: apiKey,
    STEAM_ACCOUNT: ctx.credentialValue || '',
    RCON_PASSWORD: ctx.rconPassword,
    EXEC: 'custom_config.cfg',
  };

  if (ctx.config.serverPassword) {
    env.SERVER_PASSWORD = ctx.config.serverPassword;
  }

  const envLines = Object.entries(env)
    .map(([key, value]) => `      ${key}: "${String(value).replace(/"/g, '\\"')}"`)
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

function renderAdminConfig(admins: string[]) {
  const content: Record<string, string> = {};
  admins.forEach((admin, index) => {
    content[admin] = `admin-${index + 1}`;
  });
  return JSON.stringify(content, null, 2);
}

export const cs2SpawnerAdapter = {
  key: 'cs2',
  validateConfig: validateCs2Config,
  render(ctx: RenderContext<Cs2ServerConfig>): RenderedGameServer {
    const gamePort = firstBinding(ctx.portBindings, 'game');
    const customConfig = [
      `exec_after_delay 30 "changelevel ${ctx.config.map}"`,
      `exec_after_delay 50 "exec ${MODE_CONFIG_FILE[ctx.config.mode]}"`,
    ].join('\n');

    return {
      composeFile: renderCompose(ctx),
      connectAddress: `${ctx.hostPublicAddress}:${gamePort.hostPort}`,
      queryPort: gamePort.hostPort,
      files: [
        {
          path: 'docker-compose.yml',
          content: renderCompose(ctx),
        },
        {
          path: 'custom_files/cfg/custom_config.cfg',
          content: `${customConfig}\n`,
        },
        {
          path: 'custom_files/cfg/MatchZy/admins.json',
          content: `${renderAdminConfig(ctx.config.admins)}\n`,
        },
      ],
    };
  },
};
