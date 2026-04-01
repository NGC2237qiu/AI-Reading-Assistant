import { NextRequest, NextResponse } from 'next/server';
import { bookstoreService, BookSearchOptions } from '@/lib/bookstore';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const query = searchParams.get('q');
    const langRestrict = searchParams.get('lang');
    const maxResults = searchParams.get('maxResults');
    const startIndex = searchParams.get('startIndex');
    const orderBy = searchParams.get('orderBy') as 'relevance' | 'newest' | null;

    if (!query) {
      return NextResponse.json(
        { error: 'Missing required parameter: q (query)' },
        { status: 400 }
      );
    }

    const options: BookSearchOptions = {
      query,
      ...(langRestrict && { langRestrict }),
      ...(maxResults && { maxResults: parseInt(maxResults, 10) }),
      ...(startIndex && { startIndex: parseInt(startIndex, 10) }),
      ...(orderBy && { orderBy }),
    };

    const result = await bookstoreService.searchBooks(options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Bookstore search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search books', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
