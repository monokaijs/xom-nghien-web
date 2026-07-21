import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { db, eq, voiceRoomPresence, voiceRooms } from '@xom/db';
import { joinRoomSchema } from '@xom/voice-contracts';
import {
  VoiceHttpError,
  cleanupVoiceState,
  errorResponse,
  findVoiceRoom,
  getPresence,
  getRoomSnapshot,
  hashAccessCode,
  privateCodeLimiter,
  requestIp,
  requireVoiceEnabled,
  requireVoiceIdentity,
} from '@/lib/voice/server';

export async function POST(request: NextRequest) {
  try {
    requireVoiceEnabled();
    const identity = await requireVoiceIdentity(request);
    const input = joinRoomSchema.parse(await request.json());
    await cleanupVoiceState();
    const accessCode = input.accessCode?.trim().toUpperCase();
    let room = input.roomId ? await findVoiceRoom(input.roomId) : null;
    if (accessCode) {
      privateCodeLimiter.consume(`private:${requestIp(request)}:${identity.subject}`, 10, 10 * 60 * 1000);
      const [codeRoom] = await db.select().from(voiceRooms).where(eq(voiceRooms.accessCodeHash, hashAccessCode(accessCode))).limit(1);
      room = codeRoom || null;
    }
    if (!room) {
      throw new VoiceHttpError(404, accessCode ? 'INVALID_CODE' : 'ROOM_NOT_FOUND', 'Room not found or code is invalid');
    }
    if (room.visibility === 'private' && room.ownerSubject !== identity.subject && identity.role !== 'admin') {
      if (!accessCode || hashAccessCode(accessCode) !== room.accessCodeHash) {
        throw new VoiceHttpError(404, 'INVALID_CODE', 'Room not found or code is invalid');
      }
    }

    const currentPresence = await getPresence(room.id);
    const existing = currentPresence.find((participant) => participant.subject === identity.subject);
    if (!existing && currentPresence.length >= room.maxParticipants) {
      throw new VoiceHttpError(409, 'ROOM_FULL', 'This room is full');
    }

    await db.delete(voiceRoomPresence).where(eq(voiceRoomPresence.subject, identity.subject));
    await db.insert(voiceRoomPresence).values({
      participantId: randomUUID(),
      roomId: room.id,
      subject: identity.subject,
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
      peerId: input.peerId,
      muted: 0,
      deafened: 0,
      forceMuted: 0,
      isAdmin: identity.role === 'admin' ? 1 : 0,
      lastSeenAt: new Date(),
    });
    await db.update(voiceRooms).set({ expiresAt: null }).where(eq(voiceRooms.id, room.id));
    room = await findVoiceRoom(room.id);
    if (!room) throw new VoiceHttpError(404, 'ROOM_EXPIRED', 'Room expired while joining');
    return Response.json({ snapshot: await getRoomSnapshot(room, identity) });
  } catch (error) {
    return errorResponse(error);
  }
}
