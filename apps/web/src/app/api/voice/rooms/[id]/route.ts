import { NextRequest } from 'next/server';
import { and, db, eq, voiceRoomPresence, voiceRooms } from '@xom/db';
import { updateRoomSchema } from '@xom/voice-contracts';
import {
  VoiceHttpError,
  canManageRoom,
  errorResponse,
  findVoiceRoom,
  generateAccessCode,
  getRoomSnapshot,
  hashAccessCode,
  requireVoiceEnabled,
  requireVoiceIdentity,
} from '@/lib/voice/server';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    requireVoiceEnabled();
    const identity = await requireVoiceIdentity(request);
    const { id } = await context.params;
    const room = await findVoiceRoom(id);
    if (!room) throw new VoiceHttpError(404, 'ROOM_NOT_FOUND', 'Room not found');
    const [membership] = await db.select({ id: voiceRoomPresence.participantId }).from(voiceRoomPresence)
      .where(and(eq(voiceRoomPresence.roomId, id), eq(voiceRoomPresence.subject, identity.subject))).limit(1);
    if (room.visibility === 'private' && !membership && !canManageRoom(identity, room)) {
      throw new VoiceHttpError(404, 'ROOM_NOT_FOUND', 'Room not found');
    }
    return Response.json({ snapshot: await getRoomSnapshot(room, identity) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    requireVoiceEnabled();
    const identity = await requireVoiceIdentity(request);
    const { id } = await context.params;
    const room = await findVoiceRoom(id);
    if (!room) throw new VoiceHttpError(404, 'ROOM_NOT_FOUND', 'Room not found');
    if (!canManageRoom(identity, room)) throw new VoiceHttpError(403, 'FORBIDDEN', 'You cannot manage this room');
    const body = await request.json();
    const input = updateRoomSchema.parse({ ...body, roomId: id });
    let accessCode: string | undefined;
    let accessCodeHash: string | null | undefined;
    if (input.visibility === 'private' && room.visibility !== 'private') {
      accessCode = generateAccessCode();
      accessCodeHash = hashAccessCode(accessCode);
    } else if (input.visibility === 'public') {
      accessCodeHash = null;
    }
    await db.update(voiceRooms).set({
      ...(input.name ? { name: input.name } : {}),
      ...(input.visibility ? { visibility: input.visibility } : {}),
      ...(accessCodeHash !== undefined ? { accessCodeHash } : {}),
    }).where(eq(voiceRooms.id, id));
    const updated = await findVoiceRoom(id);
    if (!updated) throw new VoiceHttpError(404, 'ROOM_NOT_FOUND', 'Room not found');
    return Response.json({ snapshot: await getRoomSnapshot(updated, identity), accessCode });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    requireVoiceEnabled();
    const identity = await requireVoiceIdentity(request);
    const { id } = await context.params;
    const room = await findVoiceRoom(id);
    if (!room) throw new VoiceHttpError(404, 'ROOM_NOT_FOUND', 'Room not found');
    if (!canManageRoom(identity, room)) throw new VoiceHttpError(403, 'FORBIDDEN', 'You cannot manage this room');
    await db.delete(voiceRooms).where(eq(voiceRooms.id, id));
    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
