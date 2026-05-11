import { NextRequest, NextResponse } from 'next/server';
import { createCipheriv, randomBytes } from 'crypto';
import { decode } from 'next-auth/jwt';
import {INVENTORY_SERVICE_URL, THIRD_PARTY_SECRET} from "@/config/app";


function generateThirdPartyToken(userId: string, expiresInMinutes: number = 5): string {
  if (!THIRD_PARTY_SECRET) {
    throw new Error('THIRD_PARTY_SECRET not configured');
  }

  const payload = {
    userId,
    exp: Date.now() + expiresInMinutes * 60 * 1000
  };

  const iv = randomBytes(16);
  const keyBuffer = Buffer.from(THIRD_PARTY_SECRET, 'utf-8');
  const key = Buffer.alloc(32);
  keyBuffer.copy(key, 0, 0, Math.min(keyBuffer.length, 32));

  const cipher = createCipheriv('aes-256-cbc', key, iv);

  let encrypted = cipher.update(JSON.stringify(payload), 'utf-8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
                         request.cookies.get('__Secure-next-auth.session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized - No session token' }, { status: 401 });
    }

    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token?.steamId) {
      return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 });
    }

    const inventoryToken = generateThirdPartyToken(token.steamId as string, 5);
    const inventoryUrl = `${INVENTORY_SERVICE_URL}/auth/third-party?access_token=${encodeURIComponent(inventoryToken)}`;

    return NextResponse.json({
      success: true,
      url: inventoryUrl,
      token: inventoryToken,
    });
  } catch (error) {
    console.error('Error generating inventory token:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication token' },
      { status: 500 }
    );
  }
}

