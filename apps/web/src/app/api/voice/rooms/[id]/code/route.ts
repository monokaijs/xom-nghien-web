import { NextRequest } from 'next/server';
import { db, eq, voiceRooms } from '@xom/db';
import {
  VoiceHttpError,
  canManageRoom,
  errorResponse,
  findVoiceRoom,
  generateAccessCode,
  hashAccessCode,
  requireVoiceEnabled,
  requireVoiceIdentity,
} from '@/lib/voice/server';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    requireVoiceEnabled();
    const identity = await requireVoiceIdentity(request);
    const { id } = await context.params;
    const room = await findVoiceRoom(id);
    if (!room) throw new VoiceHttpError(404, 'ROOM_NOT_FOUND', 'Room not found');
    if (!canManageRoom(identity, room)) throw new VoiceHttpError(403, 'FORBIDDEN', 'You cannot manage this room');
    if (room.visibility !== 'private') throw new VoiceHttpError(400, 'INVALID_INPUT', 'Public rooms do not have access codes');
    const accessCode = generateAccessCode();
    await db.update(voiceRooms).set({ accessCodeHash: hashAccessCode(accessCode) }).where(eq(voiceRooms.id, id));
    return Response.json({ accessCode });
  } catch (error) {
    return errorResponse(error);
  }
}
