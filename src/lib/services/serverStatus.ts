import {GameServer} from "@/lib/config/servers";
import {GameDig} from "gamedig";

class ServerStatusService {
  async getServerStatus(server: GameServer) {
    return await GameDig.query({
      type: server.type,
      host: server.ip,
      port: server.port,
    });
  }
}

export const serverStatusService = new ServerStatusService();
