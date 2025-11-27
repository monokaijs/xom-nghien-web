import { NextRequest, NextResponse } from 'next/server';
import { INVENTORY_SERVICE_URL } from '@/config/app';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ steamid64: string }> }
) {
  try {
    const { steamid64 } = await params;

    const inventoryUrl = `${INVENTORY_SERVICE_URL}/api/inventory/${steamid64}.json`;
    const response = await fetch(inventoryUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory data' },
      { status: 500 }
    );
  }
}

