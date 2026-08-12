import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '@xom/db';
import { config } from './config.js';
import { PARSER_VERSION, parseDemo, resolveDemoPath } from './parser.js';
import { rateMatchIfEligible } from './rating-service.js';

interface DemoJob extends RowDataPacket {
  id: number;
  matchid: number;
  storage_key: string;
  sha256: string;
}

function chunks<T>(values: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

export class DemoWorker {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private lastCompletedAt: string | null = null;
  private lastError: string | null = null;

  async start() {
    await pool.execute(
      `UPDATE matchzy_demos
       SET parse_status = 'queued', parse_started_at = NULL
       WHERE parse_status = 'processing'
         AND parse_started_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)`,
    );
    this.schedule(0);
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  getHealth() {
    return { running: this.running, lastCompletedAt: this.lastCompletedAt, lastError: this.lastError };
  }

  private schedule(delay: number) {
    this.timer = setTimeout(() => void this.tick(), delay);
  }

  private async claim(): Promise<DemoJob | null> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<DemoJob[]>(
        `SELECT id, matchid, storage_key, sha256
         FROM matchzy_demos
         WHERE parse_status IN ('queued', 'failed') AND parse_attempts < ?
         ORDER BY uploaded_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED`,
        [config.maxAttempts],
      );
      const job = rows[0];
      if (!job) {
        await connection.rollback();
        return null;
      }
      await connection.execute(
        `UPDATE matchzy_demos
         SET parse_status = 'processing', parse_attempts = parse_attempts + 1,
             parse_started_at = NOW(3), parse_error = NULL
         WHERE id = ?`,
        [job.id],
      );
      await connection.commit();
      return job;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  private async process(job: DemoJob) {
    const parsed = parseDemo(resolveDemoPath(config.storageRoot, job.storage_key));
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [currentRows] = await connection.query<RowDataPacket[]>(
        'SELECT sha256, parse_status FROM matchzy_demos WHERE id = ? FOR UPDATE',
        [job.id],
      );
      if (currentRows[0]?.sha256 !== job.sha256 || currentRows[0]?.parse_status !== 'processing') {
        await connection.rollback();
        return;
      }
      await connection.execute('DELETE FROM match_demo_events WHERE demo_id = ?', [job.id]);
      await connection.execute('DELETE FROM match_demo_rounds WHERE demo_id = ?', [job.id]);

      for (const batch of chunks(parsed.rounds, 250)) {
        const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
        await connection.execute(
          `INSERT INTO match_demo_rounds
            (demo_id, round_number, start_tick, end_tick, winner_side, winner_team, end_reason, team1_score, team2_score)
           VALUES ${placeholders}`,
          batch.flatMap((round) => [job.id, round.roundNumber, round.startTick, round.endTick, round.winnerSide, round.winnerTeam, round.endReason, round.team1Score, round.team2Score]),
        );
      }

      for (const batch of chunks(parsed.events, 250)) {
        const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
        await connection.execute(
          `INSERT INTO match_demo_events
            (demo_id, round_number, tick, event_type, actor_steamid64, target_steamid64, weapon, value, payload)
           VALUES ${placeholders}`,
          batch.flatMap((event) => [job.id, event.roundNumber, event.tick, event.eventType, event.actorSteamid64, event.targetSteamid64, event.weapon, event.value, event.payload]),
        );
      }

      await connection.execute(
        `UPDATE matchzy_demos
         SET parse_status = 'complete', parser_version = ?, parsed_at = NOW(3), parse_error = NULL
         WHERE id = ?`,
        [PARSER_VERSION, job.id],
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    await rateMatchIfEligible(job.matchid, config.ratedServers);
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    let foundJob = false;
    let activeJob: DemoJob | null = null;
    try {
      const job = await this.claim();
      activeJob = job;
      foundJob = Boolean(job);
      if (job) {
        await this.process(job);
        this.lastCompletedAt = new Date().toISOString();
        this.lastError = null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.lastError = message;
      console.error('Demo parser job failed:', error);
      if (activeJob) {
        const connection = await pool.getConnection();
        try {
          await connection.execute(
            `UPDATE matchzy_demos
             SET parse_status = 'failed', parse_error = LEFT(?, 4000)
             WHERE id = ? AND parse_status = 'processing'`,
            [message, activeJob.id],
          );
        } finally {
          connection.release();
        }
      }
    } finally {
      this.running = false;
      this.schedule(foundJob ? 0 : config.pollIntervalMs);
    }
  }
}
