import path from 'node:path';
import { parseEvent, parseHeader } from '@laihoe/demoparser2';

export const PARSER_VERSION = 'demoparser2@0.42.0';

type RawEvent = Record<string, unknown>;

export interface ParsedRound {
  roundNumber: number;
  startTick: number | null;
  endTick: number | null;
  winnerSide: string | null;
  winnerTeam: string | null;
  endReason: string | null;
  team1Score: number;
  team2Score: number;
}

export interface ParsedEvent {
  roundNumber: number;
  tick: number;
  eventType: string;
  actorSteamid64: string | null;
  targetSteamid64: string | null;
  weapon: string | null;
  value: number | null;
  payload: string;
}

const EVENT_NAMES = [
  'round_start',
  'round_end',
  'player_death',
  'player_hurt',
  'weapon_fire',
  'bomb_planted',
  'bomb_defused',
  'bomb_exploded',
  'player_blind',
] as const;

function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asString(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

function first(event: RawEvent, keys: string[]) {
  for (const key of keys) {
    if (event[key] !== null && event[key] !== undefined && event[key] !== '') return event[key];
  }
  return null;
}

export function roundNumber(event: RawEvent) {
  const explicitRound = first(event, ['round_number', 'round']);
  if (explicitRound !== null) return asNumber(explicitRound);

  const totalRoundsPlayed = event.total_rounds_played;
  if (totalRoundsPlayed !== null && totalRoundsPlayed !== undefined && totalRoundsPlayed !== '') {
    return asNumber(totalRoundsPlayed) + 1;
  }
  return 0;
}

function stringifyPayload(value: unknown) {
  return JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item);
}

function winnerSide(value: unknown) {
  if (value === 2 || value === '2' || String(value).toUpperCase() === 'T') return 'T';
  if (value === 3 || value === '3' || String(value).toUpperCase() === 'CT') return 'CT';
  return asString(value);
}

export function resolveDemoPath(storageRoot: string, storageKey: string) {
  const root = path.resolve(storageRoot);
  const resolved = path.resolve(root, storageKey);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error('Demo storage key escapes the configured storage root');
  }
  return resolved;
}

export function parseDemo(filePath: string) {
  const header = parseHeader(filePath) as RawEvent;
  const rawByType = new Map<string, RawEvent[]>();

  for (const eventName of EVENT_NAMES) {
    try {
      const parsed = parseEvent(
        filePath,
        eventName,
        ['team_name', 'team_num'],
        ['total_rounds_played', 'round_start_time'],
      );
      rawByType.set(eventName, Array.isArray(parsed) ? parsed as RawEvent[] : []);
    } catch (error) {
      console.warn(`Could not parse optional ${eventName} events:`, error);
      rawByType.set(eventName, []);
    }
  }

  const starts = new Map<number, number>();
  for (const event of rawByType.get('round_start') || []) {
    const number = roundNumber(event);
    if (number > 0) starts.set(number, asNumber(event.tick));
  }

  const roundsByNumber = new Map<number, ParsedRound>();
  for (const event of rawByType.get('round_end') || []) {
    const number = roundNumber(event);
    if (number <= 0) continue;
    roundsByNumber.set(number, {
      roundNumber: number,
      startTick: starts.get(number) ?? null,
      endTick: asNumber(event.tick) || null,
      winnerSide: winnerSide(first(event, ['winner', 'winner_side'])),
      winnerTeam: asString(first(event, ['winner_team_name', 'winner_name'])),
      endReason: asString(first(event, ['reason', 'round_end_reason'])),
      team1Score: asNumber(first(event, ['team1_score', 't_score'])),
      team2Score: asNumber(first(event, ['team2_score', 'ct_score'])),
    });
  }
  const rounds = [...roundsByNumber.values()].sort((a, b) => a.roundNumber - b.roundNumber);

  const events: ParsedEvent[] = [];
  for (const [eventType, rawEvents] of rawByType) {
    if (eventType === 'round_start' || eventType === 'round_end') continue;
    for (const event of rawEvents) {
      const actorKeys = eventType === 'player_death' || eventType === 'player_hurt'
        ? ['attacker_steamid', 'attacker_steamid64', 'attacker_xuid']
        : ['user_steamid', 'steamid', 'player_steamid', 'user_xuid'];
      const targetKeys = eventType === 'player_death' || eventType === 'player_hurt'
        ? ['user_steamid', 'victim_steamid', 'user_xuid']
        : [];

      events.push({
        roundNumber: roundNumber(event),
        tick: asNumber(event.tick),
        eventType,
        actorSteamid64: asString(first(event, actorKeys)),
        targetSteamid64: asString(first(event, targetKeys)),
        weapon: asString(first(event, ['weapon', 'weapon_name'])),
        value: eventType === 'player_hurt'
          ? asNumber(first(event, ['dmg_health', 'damage']))
          : eventType === 'player_blind'
            ? Math.round(asNumber(first(event, ['blind_duration', 'duration'])) * 1_000)
            : null,
        payload: stringifyPayload(event),
      });
    }
  }

  return { header, rounds, events };
}
