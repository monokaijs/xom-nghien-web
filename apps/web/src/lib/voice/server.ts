import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { jwtVerify, SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import {
  and,
  db,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lte,
  or,
  sql,
  userInfo,
  voiceRoomPresence,
  voiceRooms,
  type VoiceRoomPresenceRecord,
  type VoiceRoomRecord,
} from '@xom/db';
import {
  VOICE_ROOM_CAPACITY,
  type IceServerConfig,
  type VoiceIdentity,
  type VoiceParticipant,
  type VoiceRoom,
  type VoiceRoomSnapshot,
} from '@xom/voice-contracts';
import { getAuthUser } from '../auth';

export const VOICE_GUEST_COOKIE = 'xom.voice-guest';
export const PRESENCE_LEASE_MS = 35_000;
export const EMPTY_ROOM_EXPIRY_MS = 5 * 60 * 1000;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

interface GuestCookiePayload {
  subject: string;
  displayName: string;
}

export class VoiceHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly retryAfterMs?: number,
  ) {
    super(message);
  }
}

export class MemoryRateLimiter {
  private entries = new Map<string, number[]>();

  consume(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const recent = (this.entries.get(key) || []).filter((value) => value > now - windowMs);
    if (recent.length >= limit) {
      this.entries.set(key, recent);
      throw new VoiceHttpError(429, 'RATE_LIMITED', 'Too many requests', recent[0] + windowMs - now);
    }
    recent.push(now);
    this.entries.set(key, recent);
  }
}

export const roomCreateLimiter = new MemoryRateLimiter();
export const privateCodeLimiter = new MemoryRateLimiter();

function guestSecret() {
  return new TextEncoder().encode(process.env.VOICE_GUEST_COOKIE_SECRET || 'local-dev-voice-guest-secret');
}

export function isVoiceEnabled() {
  return process.env.VOICE_ENABLED !== 'false';
}

export function requestIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

export async function signGuestCookie(payload: GuestCookiePayload): Promise<string> {
  return new SignJWT({ displayName: payload.displayName })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.subject)
    .setIssuer('xom-web')
    .setAudience('xom-voice-guest')
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(guestSecret());
}

async function readGuestCookie(request: NextRequest): Promise<GuestCookiePayload | null> {
  const token = request.cookies.get(VOICE_GUEST_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, guestSecret(), {
      issuer: 'xom-web',
      audience: 'xom-voice-guest',
    });
    if (!payload.sub || typeof payload.displayName !== 'string') return null;
    return { subject: payload.sub, displayName: payload.displayName };
  } catch {
    return null;
  }
}

export async function getVoiceIdentity(request: NextRequest): Promise<VoiceIdentity | null> {
  const auth = await getAuthUser(request);
  if (auth) {
    if (auth.banned) throw new VoiceHttpError(403, 'FORBIDDEN', 'Account banned');
    const [record] = await db.select().from(userInfo).where(eq(userInfo.steamid64, auth.steamId)).limit(1);
    if (!record) return null;
    return {
      subject: `user:${record.steamid64}`,
      kind: 'user',
      displayName: record.name.trim().slice(0, 32) || 'Người chơi',
      avatarUrl: record.avatarfull || record.avatarmedium || record.avatar || null,
      role: auth.role,
    };
  }
  const guest = await readGuestCookie(request);
  if (!guest) return null;
  return {
    subject: `guest:${guest.subject}`,
    kind: 'guest',
    displayName: guest.displayName,
    avatarUrl: null,
    role: 'guest',
  };
}

export async function requireVoiceIdentity(request: NextRequest): Promise<VoiceIdentity> {
  const identity = await getVoiceIdentity(request);
  if (!identity) throw new VoiceHttpError(401, 'FORBIDDEN', 'Start a voice session first');
  return identity;
}

export function createGuestPayload(displayName: string): GuestCookiePayload {
  const normalized = displayName.trim();
  if (normalized.length < 2 || normalized.length > 32) {
    throw new VoiceHttpError(400, 'INVALID_INPUT', 'Guest name must be 2–32 characters');
  }
  return { subject: randomUUID(), displayName: normalized };
}

export function generateAccessCode(): string {
  const bytes = randomBytes(8);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
}

export function hashAccessCode(code: string): string {
  const secret = process.env.VOICE_ROOM_CODE_SECRET || 'local-dev-room-code-secret';
  return createHmac('sha256', secret).update(code.trim().toUpperCase()).digest('hex');
}

export function createIceServers(identity: VoiceIdentity): IceServerConfig[] {
  const stunUrls = (process.env.STUN_URLS || 'stun:stun.l.google.com:19302')
    .split(',').map((url) => url.trim()).filter(Boolean);
  const servers: IceServerConfig[] = stunUrls.length ? [{ urls: stunUrls }] : [];
  const turnUrls = (process.env.TURN_URLS || '').split(',').map((url) => url.trim()).filter(Boolean);
  const turnSecret = process.env.TURN_SHARED_SECRET;
  if (turnUrls.length && turnSecret) {
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const username = `${expires}:${identity.subject}`;
    servers.push({
      urls: turnUrls,
      username,
      credential: createHmac('sha1', turnSecret).update(username).digest('base64'),
    });
  }
  return servers;
}

export async function cleanupVoiceState() {
  const now = new Date();
  const leaseCutoff = new Date(now.getTime() - PRESENCE_LEASE_MS);
  await db.delete(voiceRoomPresence).where(lte(voiceRoomPresence.lastSeenAt, leaseCutoff));
  await db.execute(sql`
    UPDATE voice_rooms room
    SET room.expires_at = ${new Date(now.getTime() + EMPTY_ROOM_EXPIRY_MS)}
    WHERE room.persistent = 0
      AND room.expires_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM voice_room_presence presence
        WHERE presence.room_id = room.id AND presence.last_seen_at > ${leaseCutoff}
      )
  `);
  await db.execute(sql`
    UPDATE voice_rooms room
    SET room.expires_at = NULL
    WHERE EXISTS (
      SELECT 1 FROM voice_room_presence presence
      WHERE presence.room_id = room.id AND presence.last_seen_at > ${leaseCutoff}
    )
  `);
  await db.delete(voiceRooms).where(and(eq(voiceRooms.persistent, 0), lte(voiceRooms.expiresAt, now)));
}

export function toParticipant(record: VoiceRoomPresenceRecord, room: VoiceRoomRecord): VoiceParticipant {
  return {
    id: record.participantId,
    subject: record.subject,
    displayName: record.displayName,
    avatarUrl: record.avatarUrl,
    peerId: record.peerId,
    muted: record.muted === 1,
    deafened: record.deafened === 1,
    forceMuted: record.forceMuted === 1,
    owner: room.ownerSubject === record.subject,
    admin: record.isAdmin === 1,
    joinedAt: record.joinedAt.toISOString(),
  };
}

export function toRoom(record: VoiceRoomRecord, participantCount: number): VoiceRoom {
  return {
    id: record.id,
    name: record.name,
    visibility: record.visibility === 'private' ? 'private' : 'public',
    persistent: record.persistent === 1,
    ownerSubject: record.ownerSubject,
    ownerName: record.ownerName,
    participantCount,
    maxParticipants: record.maxParticipants,
    full: participantCount >= record.maxParticipants,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function getPresence(roomId: string): Promise<VoiceRoomPresenceRecord[]> {
  return db.select().from(voiceRoomPresence).where(and(
    eq(voiceRoomPresence.roomId, roomId),
    gt(voiceRoomPresence.lastSeenAt, new Date(Date.now() - PRESENCE_LEASE_MS)),
  )).orderBy(voiceRoomPresence.joinedAt);
}

export async function findVoiceRoom(roomId: string): Promise<VoiceRoomRecord | null> {
  const [room] = await db.select().from(voiceRooms).where(eq(voiceRooms.id, roomId)).limit(1);
  return room || null;
}

export async function getRoomSnapshot(room: VoiceRoomRecord, identity: VoiceIdentity): Promise<VoiceRoomSnapshot> {
  const presence = await getPresence(room.id);
  return {
    room: toRoom(room, presence.length),
    participants: presence.map((record) => toParticipant(record, room)),
    capabilities: {
      owner: room.ownerSubject === identity.subject,
      admin: identity.role === 'admin',
      canManageRoom: room.ownerSubject === identity.subject || identity.role === 'admin',
    },
    iceServers: createIceServers(identity),
  };
}

export async function listVoiceRooms(identity: VoiceIdentity, includePrivate = false): Promise<VoiceRoom[]> {
  await cleanupVoiceState();
  const rooms = await db.select().from(voiceRooms)
    .where(includePrivate && identity.role === 'admin' ? undefined : eq(voiceRooms.visibility, 'public'))
    .orderBy(desc(voiceRooms.persistent), desc(voiceRooms.createdAt));
  if (!rooms.length) return [];
  const presence = await db.select().from(voiceRoomPresence).where(and(
    inArray(voiceRoomPresence.roomId, rooms.map((room) => room.id)),
    gt(voiceRoomPresence.lastSeenAt, new Date(Date.now() - PRESENCE_LEASE_MS)),
  ));
  const counts = new Map<string, number>();
  for (const participant of presence) counts.set(participant.roomId, (counts.get(participant.roomId) || 0) + 1);
  return rooms.map((room) => toRoom(room, counts.get(room.id) || 0));
}

export function canManageRoom(identity: VoiceIdentity, room: VoiceRoomRecord) {
  return identity.role === 'admin' || identity.subject === room.ownerSubject;
}

export function errorResponse(error: unknown): Response {
  if (error instanceof VoiceHttpError) {
    return Response.json({ error: { code: error.code, message: error.message, retryAfterMs: error.retryAfterMs } }, { status: error.status });
  }
  console.error('Voice API error:', error);
  return Response.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Voice service is unavailable' } }, { status: 500 });
}

export function requireVoiceEnabled() {
  if (!isVoiceEnabled()) throw new VoiceHttpError(503, 'SERVICE_UNAVAILABLE', 'Voice rooms are currently disabled');
}
