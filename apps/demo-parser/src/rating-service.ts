import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { pool } from '@xom/db';
import { calculateRatingChange, isRatedServer, XN_INITIAL_RATING } from './rating.js';

interface MatchRow extends RowDataPacket {
  matchid: number;
  end_time: Date | null;
  team1_name: string;
  team1_score: number;
  team2_name: string;
  team2_score: number;
  server_ip: string;
  map_count: number;
  demo_count: number;
  parsed_demo_count: number;
  round_score_team1: number;
  round_score_team2: number;
}

interface PlayerRow extends RowDataPacket {
  steamid64: string;
  team: string;
}

interface ExistingRatingRow extends RowDataPacket {
  steamid64: string;
  rating: number;
  matches_played: number;
}

function scoreResult(forScore: number, againstScore: number): 0 | 0.5 | 1 {
  if (forScore > againstScore) return 1;
  if (forScore < againstScore) return 0;
  return 0.5;
}

async function markSkipped(connection: PoolConnection, matchId: number, reason: string) {
  await connection.execute(
    `INSERT INTO xn_match_ratings (matchid, status, reason)
     VALUES (?, 'skipped', ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), reason = VALUES(reason)`,
    [matchId, reason.slice(0, 255)],
  );
}

export async function rateMatchIfEligible(matchId: number, ratedServers: string[]) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      `INSERT IGNORE INTO xn_match_ratings (matchid, status, reason)
       VALUES (?, 'processing', NULL)`,
      [matchId],
    );

    const [statusRows] = await connection.query<RowDataPacket[]>(
      'SELECT status FROM xn_match_ratings WHERE matchid = ? FOR UPDATE',
      [matchId],
    );
    if (statusRows[0]?.status === 'rated' || statusRows[0]?.status === 'skipped') {
      await connection.rollback();
      return false;
    }

    const [matchRows] = await connection.query<MatchRow[]>(
      `SELECT m.*,
        COUNT(DISTINCT mp.mapnumber) AS map_count,
        COUNT(DISTINCT d.id) AS demo_count,
        COUNT(DISTINCT CASE WHEN d.parse_status = 'complete' THEN d.id END) AS parsed_demo_count,
        COALESCE(SUM(mp.team1_score), 0) AS round_score_team1,
        COALESCE(SUM(mp.team2_score), 0) AS round_score_team2
       FROM matchzy_stats_matches m
       LEFT JOIN matchzy_stats_maps mp ON mp.matchid = m.matchid
       LEFT JOIN matchzy_demos d ON d.matchid = m.matchid AND d.mapnumber = mp.mapnumber
       WHERE m.matchid = ?
       GROUP BY m.matchid
       FOR UPDATE`,
      [matchId],
    );
    const match = matchRows[0];
    if (!match) {
      await connection.rollback();
      return false;
    }

    if (!match.end_time || match.map_count === 0 || match.demo_count !== match.map_count || match.parsed_demo_count !== match.demo_count) {
      await connection.rollback();
      return false;
    }
    if (!isRatedServer(match.server_ip, ratedServers)) {
      await markSkipped(connection, matchId, 'Server is not in XN_RATED_SERVER_ADDRESSES');
      await connection.commit();
      return false;
    }
    if (match.team1_score === match.team2_score) {
      await markSkipped(connection, matchId, 'Draws are not rated');
      await connection.commit();
      return false;
    }

    const [playerRows] = await connection.query<PlayerRow[]>(
      `SELECT steamid64, MAX(team) AS team
       FROM matchzy_stats_players
       WHERE matchid = ? AND steamid64 REGEXP '^[0-9]{16,20}$' AND steamid64 <> '0'
       GROUP BY steamid64`,
      [matchId],
    );
    const team1 = playerRows.filter((player) => player.team === match.team1_name);
    const team2 = playerRows.filter((player) => player.team === match.team2_name);
    if (team1.length !== 5 || team2.length !== 5 || playerRows.length !== 10) {
      await markSkipped(connection, matchId, 'A rated match requires two complete teams of five unique Steam players');
      await connection.commit();
      return false;
    }

    const steamIds = playerRows.map((player) => player.steamid64);
    const placeholders = steamIds.map(() => '?').join(',');
    const [existingRows] = await connection.query<ExistingRatingRow[]>(
      `SELECT steamid64, rating, matches_played FROM xn_ratings WHERE steamid64 IN (${placeholders}) FOR UPDATE`,
      steamIds,
    );
    const existing = new Map(existingRows.map((row) => [row.steamid64, row]));
    const ratingOf = (steamid64: string) => existing.get(steamid64)?.rating ?? XN_INITIAL_RATING;
    const average = (players: PlayerRow[]) => Math.round(
      players.reduce((total, player) => total + ratingOf(player.steamid64), 0) / players.length,
    );
    const team1Average = average(team1);
    const team2Average = average(team2);

    for (const player of playerRows) {
      const onTeam1 = player.team === match.team1_name;
      const matchScoreFor = onTeam1 ? match.team1_score : match.team2_score;
      const matchScoreAgainst = onTeam1 ? match.team2_score : match.team1_score;
      const roundScoreFor = onTeam1 ? Number(match.round_score_team1) : Number(match.round_score_team2);
      const roundScoreAgainst = onTeam1 ? Number(match.round_score_team2) : Number(match.round_score_team1);
      const result = scoreResult(matchScoreFor, matchScoreAgainst);
      const current = existing.get(player.steamid64);
      const ratingBefore = current?.rating ?? XN_INITIAL_RATING;
      const change = calculateRatingChange({
        rating: ratingBefore,
        matchesPlayed: current?.matches_played ?? 0,
        opponentTeamRating: onTeam1 ? team2Average : team1Average,
        result,
        scoreFor: roundScoreFor,
        scoreAgainst: roundScoreAgainst,
      });

      await connection.execute(
        `INSERT INTO xn_rating_ledger
          (matchid, steamid64, team, rating_before, rating_delta, rating_after, expected_score, result_score, opponent_team_rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          matchId,
          player.steamid64,
          player.team,
          ratingBefore,
          change.delta,
          change.after,
          change.expected,
          result,
          onTeam1 ? team2Average : team1Average,
        ],
      );
      await connection.execute(
        `INSERT INTO xn_ratings (steamid64, rating, matches_played, wins, losses)
         VALUES (?, ?, 1, ?, ?)
         ON DUPLICATE KEY UPDATE
           rating = VALUES(rating),
           matches_played = matches_played + 1,
           wins = wins + VALUES(wins),
           losses = losses + VALUES(losses)`,
        [player.steamid64, change.after, matchScoreFor > matchScoreAgainst ? 1 : 0, matchScoreFor < matchScoreAgainst ? 1 : 0],
      );
    }

    await connection.execute(
      `INSERT INTO xn_match_ratings (matchid, status, reason, rated_at)
       VALUES (?, 'rated', NULL, NOW(3))
       ON DUPLICATE KEY UPDATE status = 'rated', reason = NULL, rated_at = NOW(3)`,
      [matchId],
    );
    await connection.commit();
    console.info(`Rated MatchZy match ${matchId}`);
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
