import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';
import { db } from '@/lib/database';
import { userInfo } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const SOCIAL_LINK_PATTERNS = {
  facebook: /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\/.+$/i,
  spotify: /^https?:\/\/(open\.)?spotify\.com\/.+$/i,
  twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+$/i,
  instagram: /^https?:\/\/(www\.)?instagram\.com\/.+$/i,
  github: /^https?:\/\/(www\.)?github\.com\/.+$/i,
};

function validateSocialLink(platform: string, url: string): boolean {
  if (!url) return true;
  const pattern = SOCIAL_LINK_PATTERNS[platform as keyof typeof SOCIAL_LINK_PATTERNS];
  return pattern ? pattern.test(url) : false;
}

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
      facebook: user.facebook || '',
      spotify: user.spotify || '',
      twitter: user.twitter || '',
      instagram: user.instagram || '',
      github: user.github || '',
    });
  } catch (error) {
    console.error('Error fetching social links:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    const { facebook, spotify, twitter, instagram, github } = body;

    const validationErrors: string[] = [];

    if (facebook && !validateSocialLink('facebook', facebook)) {
      validationErrors.push('Invalid Facebook URL');
    }
    if (spotify && !validateSocialLink('spotify', spotify)) {
      validationErrors.push('Invalid Spotify URL');
    }
    if (twitter && !validateSocialLink('twitter', twitter)) {
      validationErrors.push('Invalid Twitter/X URL');
    }
    if (instagram && !validateSocialLink('instagram', instagram)) {
      validationErrors.push('Invalid Instagram URL');
    }
    if (github && !validateSocialLink('github', github)) {
      validationErrors.push('Invalid GitHub URL');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 });
    }

    await db
      .update(userInfo)
      .set({
        facebook: facebook || null,
        spotify: spotify || null,
        twitter: twitter || null,
        instagram: instagram || null,
        github: github || null,
      })
      .where(eq(userInfo.steamid64, token.steamId as string));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating social links:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

