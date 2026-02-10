
import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy API to bypass CORS restrictions when fetching images for PDF generation.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing URL', { status: 400 });

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Fetch failed');
    
    const blob = await response.blob();
    const contentType = response.headers.get('Content-Type') || 'image/png';
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    console.error('Proxy image error:', e);
    return new NextResponse('Proxy failed', { status: 500 });
  }
}
