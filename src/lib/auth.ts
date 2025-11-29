import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';
import { db } from './database';
import { userInfo } from './db/schema';
import { eq } from 'drizzle-orm';

export type UserRole = 'admin' | 'moderator' | 'user';

export interface AuthUser {
  steamId: string;
  role: UserRole;
  banned: boolean;
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
                         request.cookies.get('__Secure-next-auth.session-token')?.value;

    if (!sessionToken) {
      return null;
    }

    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token?.steamId) {
      return null;
    }

    const userResult = await db
      .select()
      .from(userInfo)
      .where(eq(userInfo.steamid64, token.steamId as string))
      .limit(1);

    if (userResult.length === 0) {
      return null;
    }

    const user = userResult[0];

    return {
      steamId: user.steamid64,
      role: (user.role || 'user') as UserRole,
      banned: user.banned === 1,
    };
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}

export function requireAuth(handler: (request: NextRequest, user: AuthUser, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.banned) {
      return NextResponse.json({ error: 'Account banned' }, { status: 403 });
    }

    return handler(request, user, context);
  };
}

export function requireRole(roles: UserRole[], handler: (request: NextRequest, user: AuthUser, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.banned) {
      return NextResponse.json({ error: 'Account banned' }, { status: 403 });
    }

    if (!roles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    return handler(request, user, context);
  };
}

export function requireAdmin(handler: (request: NextRequest, user: AuthUser, context?: any) => Promise<NextResponse>) {
  return requireRole(['admin'], handler);
}

export function requireModerator(handler: (request: NextRequest, user: AuthUser, context?: any) => Promise<NextResponse>) {
  return requireRole(['admin', 'moderator'], handler);
}

export function canManageUser(currentUser: AuthUser, targetRole: UserRole): boolean {
  if (currentUser.role === 'admin') {
    return true;
  }
  
  if (currentUser.role === 'moderator') {
    return targetRole === 'user';
  }
  
  return false;
}

