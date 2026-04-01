/**
 * 书库服务模块
 * 支持多种书库API，默认使用Google Books API
 * 如果API不可用，会自动切换到模拟数据模式
 */

export interface Book {
  id: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  averageRating?: number;
  ratingsCount?: number;
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
  language?: string;
  categories?: string[];
  infoLink?: string;
  canonicalVolumeLink?: string;
}

export interface BookSearchResponse {
  totalItems: number;
  items: Book[];
}

export interface BookSearchOptions {
  query: string;
  langRestrict?: string;
  maxResults?: number;
  startIndex?: number;
  orderBy?: 'relevance' | 'newest';
  printType?: 'all' | 'books' | 'magazines';
}

/**
 * Google Books API 客户端
 */
class GoogleBooksClient {
  private baseUrl = 'https://www.googleapis.com/books/v1/volumes';

  async search(options: BookSearchOptions): Promise<BookSearchResponse> {
    const params = new URLSearchParams({
      q: options.query,
      maxResults: (options.maxResults || 10).toString(),
      ...(options.langRestrict && { langRestrict: options.langRestrict }),
      ...(options.startIndex && { startIndex: options.startIndex.toString() }),
      ...(options.orderBy && { orderBy: options.orderBy }),
      ...(options.printType && { printType: options.printType }),
    });

    try {
      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        signal: AbortSignal.timeout(5000), // 5秒超时
      });

      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformResponse(data);
    } catch (error) {
      console.error('Google Books API error, using mock data:', error);
      // API失败时使用模拟数据
      return {
        totalItems: 5,
        items: this.generateMockBooks(options.query, options.maxResults || 10),
      };
    }
  }

  private transformResponse(data: any): BookSearchResponse {
    if (!data.items) {
      return { totalItems: 0, items: [] };
    }

    const items: Book[] = data.items.map((item: any) => ({
      id: item.id,
      title: item.volumeInfo?.title || 'Unknown',
      authors: item.volumeInfo?.authors || [],
      publisher: item.volumeInfo?.publisher,
      publishedDate: item.volumeInfo?.publishedDate,
      description: item.volumeInfo?.description,
      pageCount: item.volumeInfo?.pageCount,
      averageRating: item.volumeInfo?.averageRating,
      ratingsCount: item.volumeInfo?.ratingsCount,
      imageLinks: item.volumeInfo?.imageLinks,
      language: item.volumeInfo?.language,
      categories: item.volumeInfo?.categories,
      infoLink: item.volumeInfo?.infoLink,
      canonicalVolumeLink: item.volumeInfo?.canonicalVolumeLink,
    }));

    return {
      totalItems: data.totalItems || 0,
      items,
    };
  }

  async getById(bookId: string): Promise<Book | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${bookId}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformBook(data);
    } catch (error) {
      console.error('Google Books API error, using mock data:', error);
      // API失败时，如果是mock_开头的ID，返回模拟数据
      if (bookId.startsWith('mock_')) {
        const mockBooks = this.generateMockBooks('', 10);
        return mockBooks.find(book => book.id === bookId) || null;
      }
      return null;
    }
  }

  private transformBook(data: any): Book {
    return {
      id: data.id,
      title: data.volumeInfo?.title || 'Unknown',
      authors: data.volumeInfo?.authors || [],
      publisher: data.volumeInfo?.publisher,
      publishedDate: data.volumeInfo?.publishedDate,
      description: data.volumeInfo?.description,
      pageCount: data.volumeInfo?.pageCount,
      averageRating: data.volumeInfo?.averageRating,
      ratingsCount: data.volumeInfo?.ratingsCount,
      imageLinks: data.volumeInfo?.imageLinks,
      language: data.volumeInfo?.language,
      categories: data.volumeInfo?.categories,
      infoLink: data.volumeInfo?.infoLink,
      canonicalVolumeLink: data.volumeInfo?.canonicalVolumeLink,
    };
  }

  /**
   * 生成模拟数据（当API不可用时使用）
   */
  private generateMockBooks(query: string, maxResults: number = 10): Book[] {
    const mockBooks: Book[] = [
      {
        id: 'mock_1',
        title: '《我家二爷》',
        authors: ['Twentine'],
        publisher: '晋江文学城',
        publishedDate: '2020',
        description: '讲述了落魄富家二爷与身边忠心小丫鬟之间相互扶持、渐生情愫的暖心故事。全文走轻松治愈路线，没有狗血虐恋情节，小丫鬟的朴实可爱和二爷的傲娇心软形成反差萌，日常互动甜而不腻。',
        pageCount: 256,
        averageRating: 4.5,
        ratingsCount: 1280,
        imageLinks: {
          thumbnail: 'https://books.google.com/books/content?id=placeholder&printsec=frontcover&img=1&zoom=1&source=gbs_api',
          small: 'https://books.google.com/books/content?id=placeholder&printsec=frontcover&img=1&zoom=2&source=gbs_api',
        },
        language: 'zh',
        categories: ['Romance', 'Chinese Literature'],
        canonicalVolumeLink: 'https://books.google.com/books?id=placeholder',
      },
      {
        id: 'mock_2',
        title: '《陛下总是被打脸》',
        authors: ['酒小七'],
        publisher: '晋江文学城',
        publishedDate: '2021',
        description: '现代历史学者穿越成不受宠的皇后，凭借丰富的历史知识频频"打脸"自以为掌控一切的皇帝，两人在斗智斗勇中逐渐撒糖的故事。作者擅长用幽默的笔触写日常，女主怼人吐槽金句频出。',
        pageCount: 312,
        averageRating: 4.7,
        ratingsCount: 2340,
        imageLinks: {
          thumbnail: 'https://books.google.com/books/content?id=placeholder&printsec=frontcover&img=1&zoom=1&source=gbs_api',
          small: 'https://books.google.com/books/content?id=placeholder&printsec=frontcover&img=1&zoom=2&source=gbs_api',
        },
        language: 'zh',
        categories: ['Romance', 'Comedy', 'Historical Fiction'],
        canonicalVolumeLink: 'https://books.google.com/books?id=placeholder',
      },
      {
        id: 'mock_3',
        title: '《春日宴》',
        authors: ['白鹭成双'],
        publisher: '晋江文学城',
        publishedDate: '2019',
        description: '被赐死的长公主李怀玉重生后，伪装身份接近有灭门之仇的御史江玄瑾，却在相处中逐渐沦陷，开启一边复仇一边撒糖的欢乐故事。女主性格跳脱毒舌，男主表面清冷禁欲实则闷骚。',
        pageCount: 340,
        averageRating: 4.6,
        ratingsCount: 1890,
        imageLinks: {
          thumbnail: 'https://books.google.com/books/content?id=placeholder&printsec=frontcover&img=1&zoom=1&source=gbs_api',
          small: 'https://books.google.com/books/content?id=placeholder&printsec=frontcover&img=1&zoom=2&source=gbs_api',
        },
        language: 'zh',
        categories: ['Romance', 'Historical Fiction', 'Rebirth'],
        canonicalVolumeLink: 'https://books.google.com/books?id=placeholder',
      },
      {
        id: 'mock_4',
        title: '《萌妃驾到》',
        authors: ['连翘'],
        publisher: '晋江文学城',
        publishedDate: '2022',
        description: '为了躲避宫廷争斗，一心想当"透明人"的步萌进宫后，却频频被皇帝温楼注意到，两人在鸡飞狗跳的日常中擦出甜蜜火花的故事。全文走轻喜剧风格，女主脑洞清奇，没有宫斗虐心剧情。',
        pageCount: 280,
        averageRating: 4.4,
        ratingsCount: 1560,
        imageLinks: {
          thumbnail: 'https://books.google.com/books/content?id=placeholder&printsec=frontcover&img=1&zoom=1&source=gbs_api',
          small: 'https://books.google.com/books/content?id=placeholder&printsec=frontcover&img=1&zoom=2&source=gbs_api',
        },
        language: 'zh',
        categories: ['Romance', 'Comedy', 'Palace'],
        canonicalVolumeLink: 'https://books.google.com/books?id=placeholder',
      },
      {
        id: 'mock_5',
        title: '《甄嬛传》',
        authors: ['流潋紫'],
        publisher: '作家出版社',
        publishedDate: '2007',
        description: '清朝雍正年间，少女甄嬛从天真烂漫的少女成长为善于谋权的太后的故事。经典宫斗小说，描写细腻，情节跌宕起伏，人物形象丰满。',
        pageCount: 800,
        averageRating: 4.8,
        ratingsCount: 5670,
        imageLinks: {
          thumbnail: 'https://books.google.com/books/content?id=placeholder&printsec=frontcover&img=1&zoom=1&source=gbs_api',
          small: 'https://books.google.com/books/content?id=placeholder&printsec=frontcover&img=1&zoom=2&source=gbs_api',
        },
        language: 'zh',
        categories: ['Romance', 'Historical Fiction', 'Palace Drama'],
        canonicalVolumeLink: 'https://books.google.com/books?id=placeholder',
      },
    ];

    // 根据查询关键词筛选书籍
    const filteredBooks = mockBooks.filter(book => {
      const queryLower = query.toLowerCase();
      return (
        book.title.toLowerCase().includes(queryLower) ||
        book.authors.some(author => author.toLowerCase().includes(queryLower)) ||
        book.description?.toLowerCase().includes(queryLower) ||
        book.categories?.some(cat => cat.toLowerCase().includes(queryLower))
      );
    });

    // 检查是否包含触发联网搜索的关键词（这些类型在当前书库中没有）
    const offlineKeywords = ['校园', '耽美', 'bl', 'bl文', '耽美文'];
    const hasOfflineKeyword = offlineKeywords.some(keyword =>
      query.toLowerCase().includes(keyword)
    );

    // 如果包含联网关键词或没有匹配的书籍，返回空数组（触发联网搜索降级）
    if (hasOfflineKeyword || filteredBooks.length === 0) {
      return [];
    }

    // 返回匹配的书籍
    return filteredBooks.slice(0, maxResults);
  }
}

/**
 * 书库服务单例
 */
class BookstoreService {
  private googleBooksClient = new GoogleBooksClient();

  /**
   * 搜索书籍
   */
  async searchBooks(options: BookSearchOptions): Promise<BookSearchResponse> {
    return this.googleBooksClient.search(options);
  }

  /**
   * 根据ID获取书籍详情
   */
  async getBookById(bookId: string): Promise<Book | null> {
    return this.googleBooksClient.getById(bookId);
  }

  /**
   * 根据关键词推荐书籍（AI辅助）
   */
  async searchBooksByKeywords(keywords: string[], maxResults = 10): Promise<BookSearchResponse> {
    const query = keywords.join(' ');
    return this.searchBooks({
      query,
      maxResults,
      langRestrict: 'zh', // 优先搜索中文书籍
    });
  }

  /**
   * 获取热门书籍（按相关性和评分排序）
   */
  async getPopularBooks(category?: string, maxResults = 10): Promise<BookSearchResponse> {
    const query = category ? `subject:${category}` : 'fiction';
    return this.searchBooks({
      query,
      maxResults,
      orderBy: 'relevance',
      langRestrict: 'zh',
    });
  }
}

// 导出单例
export const bookstoreService = new BookstoreService();
