import { NextRequest } from 'next/server';
import { and, db, eq, voiceRoomPresence } from '@xom/db';
import { participantActionSchema } from '@xom/voice-contracts';
import {
  VoiceHttpError,
  canManageRoom,
  errorResponse,
  findVoiceRoom,
  getRoomSnapshot,
  requireVoiceEnabled,
  requireVoiceIdentity,
} from '@/lib/voice/server';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    requireVoiceEnabled();
    const identity = await requireVoiceIdentity(request);
    const { id } = await context.params;
    const body = await request.json();
    const action = body.action as 'force-mute' | 'unmute' | 'kick';
    const parsed = participantActionSchema.parse({
      roomId: id,
      participantId: body.participantId,
      forceMuted: action === 'force-mute',
    });
    if (!['force-mute', 'unmute', 'kick'].includes(action)) {
      throw new VoiceHttpError(400, 'INVALID_INPUT', 'Unknown moderation action');
    }
    const room = await findVoiceRoom(id);
    if (!room) throw new VoiceHttpError(404, 'ROOM_NOT_FOUND', 'Room not found');
    if (!canManageRoom(identity, room)) throw new VoiceHttpError(403, 'FORBIDDEN', 'You cannot moderate this room');
    const [target] = await db.select().from(voiceRoomPresence).where(and(
      eq(voiceRoomPresence.roomId, id),
      eq(voiceRoomPresence.participantId, parsed.participantId),
    )).limit(1);
    if (!target) throw new VoiceHttpError(404, 'ROOM_NOT_FOUND', 'Participant not found');
    if (action === 'kick') {
      await db.delete(voiceRoomPresence).where(eq(voiceRoomPresence.participantId, target.participantId));
    } else {
      const forceMuted = action === 'force-mute';
      await db.update(voiceRoomPresence).set({
        forceMuted: forceMuted ? 1 : 0,
        muted: forceMuted ? 1 : target.muted,
      }).where(eq(voiceRoomPresence.participantId, target.participantId));
    }
    return Response.json({ snapshot: await getRoomSnapshot(room, identity), action });
  } catch (error) {
    return errorResponse(error);
  }
}
