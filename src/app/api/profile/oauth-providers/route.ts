import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';
import { db } from '@/lib/database';
import { userInfo } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
                         request.cookies.get('__Secure-next-auth.session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token?.steamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userInfoResult = await db
      .select()
      .from(userInfo)
      .where(eq(userInfo.steamid64, token.steamId as string))
      .limit(1);

    if (userInfoResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userInfoResult[0];
    return NextResponse.json({
      steam: !!user.steamid64 && !user.steamid64.startsWith('google_') && !user.steamid64.startsWith('discord_') && !user.steamid64.startsWith('github_'),
      google: !!user.google_id,
      discord: !!user.discord_id,
      github: !!user.github_oauth_id,
    });
  } catch (error) {
    console.error('Error fetching OAuth providers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
                         request.cookies.get('__Secure-next-auth.session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token?.steamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, providerId } = body;

    if (!provider || !providerId) {
      return NextResponse.json({ error: 'Provider and providerId are required' }, { status: 400 });
    }

    const updateData: any = {};
    if (provider === 'google') {
      updateData.google_id = providerId;
    } else if (provider === 'discord') {
      updateData.discord_id = providerId;
    } else if (provider === 'github') {
      updateData.github_oauth_id = providerId;
    } else {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    await db
      .update(userInfo)
      .set(updateData)
      .where(eq(userInfo.steamid64, token.steamId as string));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error linking OAuth provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
                         request.cookies.get('__Secure-next-auth.session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token?.steamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (provider === 'google') {
      updateData.google_id = null;
    } else if (provider === 'discord') {
      updateData.discord_id = null;
    } else if (provider === 'github') {
      updateData.github_oauth_id = null;
    } else {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    await db
      .update(userInfo)
      .set(updateData)
      .where(eq(userInfo.steamid64, token.steamId as string));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unlinking OAuth provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

