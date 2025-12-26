import { GameMode } from '@/types/lobby';

interface GenerateComposeOpts {
  port: number;
  name: string;
  steamAccount: string;
  rconPassword: string;
  serverPassword?: string;
  maxPlayer: number;
  tickRate: number;
  rootPath: string;
}

export const generateDockerCompose = (opts: GenerateComposeOpts) => {
  const apiKey = process.env.STEAM_WEB_API_KEY || '';

  const env: Record<string, string | number> = {
    TICKRATE: opts.tickRate,
    MAXPLAYERS: opts.maxPlayer,
    API_KEY: apiKey,
    STEAM_ACCOUNT: opts.steamAccount,
    RCON_PASSWORD: opts.rconPassword,
    EXEC: 'custom_config.cfg',
  };

  if (opts.serverPassword) {
    env.SERVER_PASSWORD = opts.serverPassword;
  }

  const envLines = Object.entries(env)
    .map(([key, value]) => `      ${key}: "${value}"`)
    .join('\n');

  return `services:
  ${opts.name}:
    image: cs2-modded-server
    container_name: ${opts.name}
    pull_policy: never
    user: "1000:1000"
    environment:
${envLines}
    volumes:
      - cs2-base:/home/steam/cs2:ro
      - steamrt-base:/home/steam/steamrt:ro
      - ./custom_files:/home/custom_files:ro
    ports:
      - "${opts.port}:27015/tcp"
      - "${opts.port}:27015/udp"
    cpu_count: 4
    mem_reservation: 8000m
    networks:
      - cs2_game-net
    restart: unless-stopped

networks:
  cs2_game-net:
    external: true

volumes:
  temp-server:
    external: true
`;
};

const MODE_CONFIG_FILE: Record<GameMode, string> = {
  [GameMode.Competitive]: 'comp.cfg',
  [GameMode.Wingman]: 'wingman.cfg',
  [GameMode.Deathmatch]: 'dm.cfg',
  [GameMode.Solo1v1]: '1v1.cfg',
  [GameMode.GunGame]: 'gg.cfg',
};

export const generateCustomConfig = (mode: GameMode, map: string) => {
  const content = `exec_after_delay 30 "changelevel ${map}"` +
  `\nexec_after_delay 50 "exec ${MODE_CONFIG_FILE[mode]}"`;
  return {
    path: 'cfg/custom_config.cfg',
    content,
  };
}

export const generateAdminConfig = (admins: string[]) => {
  const content: Record<string, string> = {};
  let count = 0;
  for (const admin of admins) {
    count++;
    content[admin] = `admin-${count}`;
  }
  return {
    path: 'cfg/MatchZy/admins.json',
    content: JSON.stringify(content),
  };
}