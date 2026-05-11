import { Injectable } from '@nestjs/common';
import { eq, sql } from '@xom/db';
import { db, serverHostJobs, serverHosts } from '@xom/db';
import { getSshConfig, validateSshAndDocker } from './remote-docker-host';

@Injectable()
export class HostProcessor {
  async validateHost(hostId: number, dbJobId?: number) {
    const hosts = await db.select().from(serverHosts).where(eq(serverHosts.id, hostId)).limit(1);
    if (hosts.length === 0) {
      throw new Error('Host not found');
    }

    if (dbJobId) {
      await db
        .update(serverHostJobs)
        .set({ status: 'running', attempts: sql`${serverHostJobs.attempts} + 1` })
        .where(eq(serverHostJobs.id, dbJobId));
    }

    try {
      await validateSshAndDocker(getSshConfig(hosts[0]));
      await db
        .update(serverHosts)
        .set({ healthStatus: 'healthy', lastCheckedAt: new Date() })
        .where(eq(serverHosts.id, hostId));
      if (dbJobId) {
        await db.update(serverHostJobs).set({ status: 'succeeded', error: null }).where(eq(serverHostJobs.id, dbJobId));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db
        .update(serverHosts)
        .set({ healthStatus: 'failed', lastCheckedAt: new Date() })
        .where(eq(serverHosts.id, hostId));
      if (dbJobId) {
        await db.update(serverHostJobs).set({ status: 'failed', error: message }).where(eq(serverHostJobs.id, dbJobId));
      }
      throw error;
    }
  }
}
