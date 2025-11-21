import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createCipheriv, randomBytes } from 'crypto';

const THIRD_PARTY_SECRET = process.env.THIRD_PARTY_SECRET;
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'https://inventory.xomnghien.com';

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
    const session = await getSession();

    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = generateThirdPartyToken(session.user.steamid, 5);
    const inventoryUrl = `${INVENTORY_SERVICE_URL}/auth/third-party?access_token=${encodeURIComponent(token)}`;

    return NextResponse.json({
      success: true,
      url: inventoryUrl,
      token,
    });
  } catch (error) {
    console.error('Error generating inventory token:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication token' },
      { status: 500 }
    );
  }
}

