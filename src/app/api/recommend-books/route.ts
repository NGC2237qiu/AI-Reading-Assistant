import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { bookstoreService, Book } from '@/lib/bookstore';

/**
 * 将书籍信息转换为AI可读的上下文格式
 */
function formatBooksAsContext(books: Book[]): string {
  if (books.length === 0) {
    return '';
  }

  const contextLines = books.map((book, index) => {
    return `书籍${index + 1}：
- 书名：${book.title}
- 作者：${book.authors.join('、') || '未知'}
- 出版社：${book.publisher || '未知'}
- 出版日期：${book.publishedDate || '未知'}
- 评分：${book.averageRating ? `${book.averageRating}/5` : '暂无评分'}
- 评价人数：${book.ratingsCount || 0}
- 简介：${book.description?.slice(0, 300) || '暂无简介'}
- 分类：${book.categories?.join('、') || '未知'}
`;
  });

  return `以下是书库中找到的相关书籍信息：

${contextLines.join('\n---\n')}

请基于以上真实的书籍信息进行推荐。`;
}

export async function POST(request: NextRequest) {
  try {
    const { preference } = await request.json();

    if (!preference || typeof preference !== 'string' || preference.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: '请输入您的阅读偏好' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);

    // 第一步：从书库搜索相关书籍
    const searchSystemPrompt = `你是一位专业的阅读助手。你的任务是根据用户的阅读偏好，生成3-5个关键词用于从书库中搜索相关书籍。

请遵循以下规则：
1. 分析用户的阅读偏好，提取关键信息（类型、风格、主题等）
2. 生成3-5个搜索关键词
3. 关键词要简洁明了，适合用于书库搜索
4. 优先考虑中文书籍相关的关键词
5. 输出格式必须是JSON数组，只包含关键词字符串

输出格式示例：
["古言 甜宠", "轻松 古代言情", "甜文 爱情"]

请只输出JSON数组，不要包含任何其他文字或说明。`;

    const searchMessages = [
      { role: 'system' as const, content: searchSystemPrompt },
      { role: 'user' as const, content: `用户偏好：${preference}` }
    ];

    // 获取搜索关键词
    const searchResponse = await llmClient.invoke(searchMessages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.7,
      thinking: 'disabled',
      caching: 'disabled'
    });

    // 解析AI生成的关键词
    let keywords: string[] = [];
    try {
      const cleanedContent = searchResponse.content.trim();
      const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        keywords = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse keywords:', error);
    }

    // 如果没有生成关键词，使用用户原始偏好
    if (keywords.length === 0) {
      keywords = [preference];
    }

    // 从书库搜索书籍
    const books: Book[] = [];
    const usedBookIds = new Set<string>();

    for (const keyword of keywords) {
      try {
        const searchResult = await bookstoreService.searchBooks({
          query: keyword,
          maxResults: 5,
          langRestrict: 'zh',
          orderBy: 'relevance'
        });

        for (const book of searchResult.items) {
          if (!usedBookIds.has(book.id) && books.length < 10) {
            usedBookIds.add(book.id);
            books.push(book);
          }
        }

        if (books.length >= 10) break;
      } catch (error) {
        console.error(`Failed to search for keyword "${keyword}":`, error);
        continue;
      }
    }

    // 第二步：判断是否有书籍，决定使用哪种推荐方式
    let recommendMessages: any[];
    let useBookstore = books.length > 0;

    if (useBookstore) {
      // 有书库数据：基于真实书籍信息推荐
      const booksContext = formatBooksAsContext(books);

      const recommendSystemPrompt = `你是一位专业的网文推荐助手。你的任务是根据用户的阅读偏好，结合书库中真实的书籍信息，为用户提供个性化的推荐。

请遵循以下规则：
1. 基于提供的真实书籍信息进行推荐，不要编造不存在的书籍
2. 推荐理由要具体，说明为什么这本书符合用户的偏好
3. 突出每本书的特色和亮点
4. 推荐3-5本最符合用户偏好的书籍
5. 输出格式清晰易读，便于用户快速浏览
6. 包含书籍的真实信息（书名、作者、评分、简介等）

输出模板：
## 推荐理由
[简要说明为什么推荐这些书籍]

## 书籍推荐

### 1. [书名]
**⭐ 评分**: [评分]/5 ([评价人数]人评价)
**👤 作者**: [作者名]
**🏢 出版社**: [出版社]
**📅 出版日期**: [出版日期]
**📝 简介**: [简短介绍]
**💡 推荐理由**: [为什么推荐这本书，如何符合用户偏好]

---

[继续推荐其他书籍...]

请直接输出推荐内容，不要包含其他客套话。`;

      recommendMessages = [
        { role: 'system' as const, content: recommendSystemPrompt },
        { role: 'user' as const, content: `用户阅读偏好：${preference}\n\n${booksContext}` }
      ];
    } else {
      // 没有书库数据：联网AI搜索推荐
      const recommendSystemPrompt = `你是一位专业的网文推荐助手。你的任务是根据用户的阅读偏好，推荐合适的网文小说。

请遵循以下规则：
1. 根据用户的描述推荐3-5本符合偏好的网文
2. 每本书包含：书名、作者、类型、一句话简介、推荐理由
3. 使用清晰的格式展示，便于用户快速浏览
4. 推荐理由要具体，说明为什么符合用户的偏好
5. 输出格式使用Markdown，每本书作为一个独立的章节

输出模板：
## 推荐理由
[简要说明为什么推荐这些类型的书籍]

## 书籍推荐

### 1. [书名]
- **作者**: [作者名]
- **类型**: [类型，如：古言、现言、权谋、热血成长等]
- **简介**: [一句话简介]
- **推荐理由**: [为什么推荐这本书，如何符合用户偏好]

---

[继续推荐其他书籍...]

请直接输出推荐内容，不要包含其他客套话。`;

      recommendMessages = [
        { role: 'system' as const, content: recommendSystemPrompt },
        { role: 'user' as const, content: preference }
      ];
    }

    // 使用流式输出AI生成的推荐
    const stream = llmClient.stream(recommendMessages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.8,
      thinking: 'disabled',
      caching: 'disabled'
    });

    // 创建可读流，流式输出AI生成的推荐
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked'
      }
    });

  } catch (error) {
    console.error('Recommend Books API error:', error);
    return new Response(
      JSON.stringify({ error: '生成推荐失败，请重试' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
