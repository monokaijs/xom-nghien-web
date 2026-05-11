import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';
import {
  INVENTORY_INTERNAL_URL,
  INVENTORY_PUBLIC_URL,
  XN_INV_API_AUTH_KEY,
} from "@/config/app";

function inventoryInternalUrl(path: string) {
  return `${INVENTORY_INTERNAL_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function GET(request: NextRequest) {
  try {
    if (!XN_INV_API_AUTH_KEY) {
      return NextResponse.json(
        { error: 'XN_INV_API_AUTH_KEY not configured' },
        { status: 500 }
      );
    }

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

    const userId = token.steamId as string;
    const signInResponse = await fetch(inventoryInternalUrl('/api/sign-in'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: XN_INV_API_AUTH_KEY,
        userId,
        avatar: typeof token.avatar === 'string' ? token.avatar : undefined,
        name: typeof token.personaname === 'string' ? token.personaname : undefined,
      }),
    });

    if (!signInResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to create inventory sign-in token' },
        { status: signInResponse.status }
      );
    }

    const { token: inventoryToken } = await signInResponse.json() as { token?: string };
    if (!inventoryToken) {
      return NextResponse.json(
        { error: 'Inventory service returned an invalid sign-in response' },
        { status: 502 }
      );
    }

    const callbackUrl = new URL(
      `${INVENTORY_PUBLIC_URL}/api/sign-in/callback`
    );
    callbackUrl.searchParams.set('token', inventoryToken);

    return NextResponse.json({
      success: true,
      url: callbackUrl.toString(),
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
