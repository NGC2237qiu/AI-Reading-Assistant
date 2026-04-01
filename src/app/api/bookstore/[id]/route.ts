import { NextRequest, NextResponse } from 'next/server';
import { bookstoreService } from '@/lib/bookstore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params;

    if (!bookId) {
      return NextResponse.json(
        { error: 'Missing required parameter: book id' },
        { status: 400 }
      );
    }

    const book = await bookstoreService.getBookById(bookId);

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error('Bookstore get book API error:', error);
    return NextResponse.json(
      { error: 'Failed to get book details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
