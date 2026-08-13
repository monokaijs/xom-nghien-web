export interface RawPlayerAnalysisEvent {
  id: number;
  mapnumber: number;
  round_number: number;
  tick: number;
  event_type: string;
  actor_steamid64: string | null;
  target_steamid64: string | null;
  weapon: string | null;
  value: number | null;
  payload: string | null;
}

export interface PlayerCombatEvent {
  id: number;
  mapnumber: number;
  round_number: number;
  tick: number;
  actor_steamid64: string;
  target_steamid64: string;
  weapon: string;
  headshot: boolean;
  distance: number | null;
}

export interface PlayerWeaponAnalytics {
  weapon: string;
  kills: number;
  shots: number;
  hits: number;
  damage: number;
  headHits: number;
  averageKillDistance: number | null;
}

export interface PlayerHitRegionAnalytics {
  region: string;
  hits: number;
  damage: number;
}

export interface PlayerMatchAnalytics {
  kills: PlayerCombatEvent[];
  deaths: PlayerCombatEvent[];
  weapons: PlayerWeaponAnalytics[];
  hitRegions: PlayerHitRegionAnalytics[];
  totals: {
    kills: number;
    shots: number;
    hits: number;
    damage: number;
  };
}

interface MutableWeaponAnalytics extends Omit<PlayerWeaponAnalytics, 'averageKillDistance'> {
  killDistanceTotal: number;
  killDistanceCount: number;
}

interface MutablePlayerAnalytics {
  kills: PlayerCombatEvent[];
  deaths: PlayerCombatEvent[];
  weapons: Map<string, MutableWeaponAnalytics>;
  hitRegions: Map<string, PlayerHitRegionAnalytics>;
}

type EventPayload = Record<string, unknown>;

function parsePayload(value: string | null): EventPayload {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed as EventPayload : {};
  } catch {
    return {};
  }
}

function asBoolean(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function asFiniteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeWeaponName(value: string | null | undefined) {
  const normalized = (value || 'unknown').toLowerCase().replace(/^weapon_/, '');
  return normalized.replace(/[^a-z0-9_-]/g, '') || 'unknown';
}

function sameTeam(payload: EventPayload) {
  const attackerTeam = asFiniteNumber(payload.attacker_team_num);
  const targetTeam = asFiniteNumber(payload.user_team_num);
  return attackerTeam !== null && targetTeam !== null && attackerTeam === targetTeam;
}

function mutablePlayer(players: Map<string, MutablePlayerAnalytics>, steamid64: string) {
  let player = players.get(steamid64);
  if (!player) {
    player = { kills: [], deaths: [], weapons: new Map(), hitRegions: new Map() };
    players.set(steamid64, player);
  }
  return player;
}

function mutableWeapon(player: MutablePlayerAnalytics, weapon: string) {
  let stats = player.weapons.get(weapon);
  if (!stats) {
    stats = {
      weapon,
      kills: 0,
      shots: 0,
      hits: 0,
      damage: 0,
      headHits: 0,
      killDistanceTotal: 0,
      killDistanceCount: 0,
    };
    player.weapons.set(weapon, stats);
  }
  return stats;
}

export function buildPlayerAnalytics(events: RawPlayerAnalysisEvent[]): Record<string, PlayerMatchAnalytics> {
  const players = new Map<string, MutablePlayerAnalytics>();

  for (const event of events) {
    const actor = event.actor_steamid64 ? String(event.actor_steamid64) : null;
    const target = event.target_steamid64 ? String(event.target_steamid64) : null;
    const payload = parsePayload(event.payload);
    const weapon = normalizeWeaponName(event.weapon);

    if (event.event_type === 'weapon_fire' && actor) {
      mutableWeapon(mutablePlayer(players, actor), weapon).shots += 1;
      continue;
    }

    if (event.event_type === 'player_hurt' && actor && actor !== target && !sameTeam(payload)) {
      const player = mutablePlayer(players, actor);
      const weaponStats = mutableWeapon(player, weapon);
      const damage = Math.max(0, asFiniteNumber(event.value) ?? asFiniteNumber(payload.dmg_health) ?? 0);
      const hitgroup = String(payload.hitgroup || 'generic').toLowerCase();

      weaponStats.hits += 1;
      weaponStats.damage += damage;
      if (hitgroup === 'head') weaponStats.headHits += 1;

      const region = player.hitRegions.get(hitgroup) || { region: hitgroup, hits: 0, damage: 0 };
      region.hits += 1;
      region.damage += damage;
      player.hitRegions.set(hitgroup, region);
      continue;
    }

    if (event.event_type !== 'player_death' || !actor || !target || actor === target || sameTeam(payload)) continue;

    const distance = asFiniteNumber(payload.distance);
    const combatEvent: PlayerCombatEvent = {
      id: Number(event.id),
      mapnumber: Number(event.mapnumber),
      round_number: Number(event.round_number),
      tick: Number(event.tick),
      actor_steamid64: actor,
      target_steamid64: target,
      weapon,
      headshot: asBoolean(payload.headshot),
      distance,
    };

    const attacker = mutablePlayer(players, actor);
    attacker.kills.push(combatEvent);
    const weaponStats = mutableWeapon(attacker, weapon);
    weaponStats.kills += 1;
    if (distance !== null) {
      weaponStats.killDistanceTotal += distance;
      weaponStats.killDistanceCount += 1;
    }
    mutablePlayer(players, target).deaths.push(combatEvent);
  }

  return Object.fromEntries([...players].map(([steamid64, player]) => {
    const weapons = [...player.weapons.values()]
      .map(({ killDistanceTotal, killDistanceCount, ...stats }) => ({
        ...stats,
        averageKillDistance: killDistanceCount ? killDistanceTotal / killDistanceCount : null,
      }))
      .filter((weapon) => weapon.shots || weapon.hits || weapon.kills)
      .sort((a, b) => b.kills - a.kills || b.damage - a.damage || b.hits - a.hits);
    const hitRegions = [...player.hitRegions.values()].sort((a, b) => b.hits - a.hits);

    return [steamid64, {
      kills: player.kills.sort((a, b) => a.mapnumber - b.mapnumber || a.round_number - b.round_number || a.tick - b.tick),
      deaths: player.deaths.sort((a, b) => a.mapnumber - b.mapnumber || a.round_number - b.round_number || a.tick - b.tick),
      weapons,
      hitRegions,
      totals: {
        kills: player.kills.length,
        shots: weapons.reduce((sum, weapon) => sum + weapon.shots, 0),
        hits: weapons.reduce((sum, weapon) => sum + weapon.hits, 0),
        damage: weapons.reduce((sum, weapon) => sum + weapon.damage, 0),
      },
    } satisfies PlayerMatchAnalytics];
  }));
}
