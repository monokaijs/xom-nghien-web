import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { and, db, eq, gt, isNull, or, voiceRooms } from '@xom/db';
import { createRoomSchema, VOICE_ROOM_CAPACITY } from '@xom/voice-contracts';
import {
  VoiceHttpError,
  errorResponse,
  findVoiceRoom,
  generateAccessCode,
  getRoomSnapshot,
  hashAccessCode,
  listVoiceRooms,
  requestIp,
  requireVoiceEnabled,
  requireVoiceIdentity,
  roomCreateLimiter,
} from '@/lib/voice/server';

export async function GET(request: NextRequest) {
  try {
    requireVoiceEnabled();
    const identity = await requireVoiceIdentity(request);
    const includePrivate = request.nextUrl.searchParams.get('scope') === 'admin';
    return Response.json({ rooms: await listVoiceRooms(identity, includePrivate) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireVoiceEnabled();
    const identity = await requireVoiceIdentity(request);
    const input = createRoomSchema.parse(await request.json());
    if (input.persistent && identity.role !== 'admin') {
      throw new VoiceHttpError(403, 'FORBIDDEN', 'Only administrators can create persistent rooms');
    }
    roomCreateLimiter.consume(`create:ip:${requestIp(request)}`, 10, 60 * 60 * 1000);
    const activeOwned = await db.select({ id: voiceRooms.id }).from(voiceRooms).where(and(
      eq(voiceRooms.ownerSubject, identity.subject),
      eq(voiceRooms.persistent, 0),
      or(isNull(voiceRooms.expiresAt), gt(voiceRooms.expiresAt, new Date())),
    ));
    if (!input.persistent && activeOwned.length >= 3) {
      throw new VoiceHttpError(429, 'RATE_LIMITED', 'You already own three active rooms');
    }

    const roomId = randomUUID();
    let accessCode: string | undefined;
    let accessCodeHash: string | null = null;
    if (input.visibility === 'private') {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const candidate = generateAccessCode();
        const candidateHash = hashAccessCode(candidate);
        const [existing] = await db.select({ id: voiceRooms.id }).from(voiceRooms).where(eq(voiceRooms.accessCodeHash, candidateHash)).limit(1);
        if (!existing) {
          accessCode = candidate;
          accessCodeHash = candidateHash;
          break;
        }
      }
      if (!accessCode) throw new VoiceHttpError(503, 'SERVICE_UNAVAILABLE', 'Could not allocate a private room code');
    }

    await db.insert(voiceRooms).values({
      id: roomId,
      name: input.name,
      visibility: input.visibility,
      accessCodeHash,
      ownerSubject: identity.subject,
      ownerName: identity.displayName,
      persistent: input.persistent ? 1 : 0,
      maxParticipants: VOICE_ROOM_CAPACITY,
      expiresAt: input.persistent ? null : new Date(Date.now() + 5 * 60 * 1000),
    });
    const room = await findVoiceRoom(roomId);
    if (!room) throw new VoiceHttpError(500, 'SERVICE_UNAVAILABLE', 'Room was not created');
    return Response.json({ snapshot: await getRoomSnapshot(room, identity), accessCode }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
