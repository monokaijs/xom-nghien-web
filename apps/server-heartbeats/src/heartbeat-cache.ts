import type { HeartbeatSnapshot, ServerMetadata, ServerTarget } from './types.js';

type LoadServers = () => Promise<ServerTarget[]>;
type QueryServer = (server: ServerTarget) => Promise<ServerMetadata>;

export class HeartbeatCache {
  private statuses: Record<string, ServerMetadata> = {};
  private refreshedAt: string | null = null;
  private refreshPromise: Promise<void> | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly loadServers: LoadServers,
    private readonly queryServer: QueryServer,
    private readonly refreshIntervalMs: number,
  ) {}

  start() {
    if (this.timer) return;
    void this.refresh();
    this.timer = setInterval(() => void this.refresh(), this.refreshIntervalMs);
    this.timer.unref();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  getSnapshot(): HeartbeatSnapshot {
    if (!this.refreshedAt || Date.now() - Date.parse(this.refreshedAt) >= this.refreshIntervalMs) {
      void this.refresh();
    }
    return {
      statuses: this.statuses,
      refreshedAt: this.refreshedAt,
      refreshing: this.refreshPromise !== null,
    };
  }

  refresh(): Promise<void> {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.performRefresh().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  private async performRefresh() {
    try {
      const servers = await this.loadServers();
      const entries = await Promise.all(servers.map(async (server) => {
        const metadata = await this.queryServer(server);
        return [String(server.id), metadata] as const;
      }));

      // Replace the complete snapshot atomically. HTTP readers never observe a
      // half-refreshed list, even when one of the probes takes several seconds.
      this.statuses = Object.fromEntries(entries);
      this.refreshedAt = new Date().toISOString();
    } catch (error) {
      // Keep serving the previous snapshot if the database or a refresh cycle
      // fails. A later interval/request will retry without delaying readers.
      console.error('Server heartbeat refresh failed:', error);
    }
  }
}
