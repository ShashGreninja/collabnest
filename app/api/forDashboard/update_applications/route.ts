import { NextResponse } from 'next/server';

export async function PUT() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Process one application at a time through /api/applications.' },
    { status: 410 },
  );
}
