import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    
    return NextResponse.json({
      isLoggedIn: session.isLoggedIn,
      user: session.user || null,
    });
  } catch (error) {
    console.error('Auth status error:', error);
    return NextResponse.json({
      isLoggedIn: false,
      user: null,
    });
  }
}
