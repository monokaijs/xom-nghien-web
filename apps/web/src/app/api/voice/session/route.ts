import { NextRequest, NextResponse } from 'next/server';
import { db, eq, userInfo } from '@xom/db';
import { getAuthUser } from '@/lib/auth';
import {
  VOICE_GUEST_COOKIE,
  VoiceHttpError,
  createGuestPayload,
  createIceServers,
  errorResponse,
  getVoiceIdentity,
  requireVoiceEnabled,
  signGuestCookie,
} from '@/lib/voice/server';

export async function POST(request: NextRequest) {
  try {
    requireVoiceEnabled();
    const auth = await getAuthUser(request);
    let response: NextResponse;
    if (auth) {
      if (auth.banned) throw new VoiceHttpError(403, 'FORBIDDEN', 'Account banned');
      const [user] = await db.select().from(userInfo).where(eq(userInfo.steamid64, auth.steamId)).limit(1);
      if (!user) throw new VoiceHttpError(401, 'FORBIDDEN', 'User not found');
      const identity = {
        subject: `user:${user.steamid64}`,
        kind: 'user' as const,
        displayName: user.name.trim().slice(0, 32) || 'Người chơi',
        avatarUrl: user.avatarfull || user.avatarmedium || user.avatar || null,
        role: auth.role,
      };
      response = NextResponse.json({ identity, iceServers: createIceServers(identity), peer: { provider: 'peerjs-cloud' } });
    } else {
      const body = await request.json().catch(() => ({}));
      const existing = await getVoiceIdentity(request);
      if (existing?.kind === 'guest' && !body.displayName) {
        response = NextResponse.json({ identity: existing, iceServers: createIceServers(existing), peer: { provider: 'peerjs-cloud' } });
      } else {
        const guest = createGuestPayload(String(body.displayName || existing?.displayName || ''));
        const identity = {
          subject: `guest:${guest.subject}`,
          kind: 'guest' as const,
          displayName: guest.displayName,
          avatarUrl: null,
          role: 'guest' as const,
        };
        response = NextResponse.json({ identity, iceServers: createIceServers(identity), peer: { provider: 'peerjs-cloud' } });
        response.cookies.set(VOICE_GUEST_COOKIE, await signGuestCookie(guest), {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
        });
      }
    }
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
