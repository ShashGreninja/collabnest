import { NextResponse } from 'next/server';

/**
 * BUG FIX 1.2: This legacy endpoint has been deprecated.
 * Use POST /api/forDashboard/endProject-new instead.
 * It is replaced here with a permanent redirect so existing bookmarks/clients
 * get a clear error rather than silently bypassing auth.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'This endpoint is deprecated. Use /api/forDashboard/endProject-new instead.',
    },
    { status: 410 } // 410 Gone
  );
}