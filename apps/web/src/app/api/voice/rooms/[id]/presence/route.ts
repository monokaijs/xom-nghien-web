import { NextRequest } from 'next/server';
import { and, db, eq, voiceRoomPresence, voiceRooms } from '@xom/db';
import { participantStateSchema } from '@xom/voice-contracts';
import {
  EMPTY_ROOM_EXPIRY_MS,
  VoiceHttpError,
  errorResponse,
  findVoiceRoom,
  getPresence,
  getRoomSnapshot,
  requireVoiceEnabled,
  requireVoiceIdentity,
} from '@/lib/voice/server';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: Context) {
  try {
    requireVoiceEnabled();
    const identity = await requireVoiceIdentity(request);
    const { id } = await context.params;
    const state = participantStateSchema.parse(await request.json());
    const room = await findVoiceRoom(id);
    if (!room) throw new VoiceHttpError(404, 'ROOM_EXPIRED', 'Room no longer exists');
    const [participant] = await db.select().from(voiceRoomPresence).where(and(
      eq(voiceRoomPresence.roomId, id),
      eq(voiceRoomPresence.subject, identity.subject),
    )).limit(1);
    if (!participant) throw new VoiceHttpError(403, 'RECONNECT_FAILED', 'You are no longer present in this room');
    await db.update(voiceRoomPresence).set({
      muted: participant.forceMuted === 1 || state.muted || state.deafened ? 1 : 0,
      deafened: state.deafened ? 1 : 0,
      lastSeenAt: new Date(),
    }).where(eq(voiceRoomPresence.participantId, participant.participantId));
    await db.update(voiceRooms).set({ expiresAt: null }).where(eq(voiceRooms.id, id));
    return Response.json({ snapshot: await getRoomSnapshot(room, identity) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    requireVoiceEnabled();
    const identity = await requireVoiceIdentity(request);
    const { id } = await context.params;
    await db.delete(voiceRoomPresence).where(and(
      eq(voiceRoomPresence.roomId, id),
      eq(voiceRoomPresence.subject, identity.subject),
    ));
    const remaining = await getPresence(id);
    if (!remaining.length) {
      await db.update(voiceRooms).set({ expiresAt: new Date(Date.now() + EMPTY_ROOM_EXPIRY_MS) })
        .where(and(eq(voiceRooms.id, id), eq(voiceRooms.persistent, 0)));
    }
    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
