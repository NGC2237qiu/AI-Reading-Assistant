import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { bookstoreService, Book } from '@/lib/bookstore';
import { getMockRecommendation } from '@/lib/mock-ai';

/**
 * 生成降级推荐（当 AI 不可用时）
 */
function generateFallbackRecommendation(preference: string, books: Book[]): string {
  const response: string[] = [];

  response.push('## 推荐理由');
  response.push(`根据您的阅读偏好"${preference}"，我们为您推荐以下书籍。由于 AI 服务暂时不可用，这里展示的是基于书库匹配的推荐结果。`);
  response.push('');

  response.push('## 书籍推荐');
  response.push('');

  if (books.length > 0) {
    books.slice(0, 5).forEach((book, index) => {
      response.push(`### ${index + 1}. ${book.title}`);
      response.push(`**⭐ 评分**: ${book.averageRating ? `${book.averageRating}/5` : '暂无评分'} (${book.ratingsCount || 0}人评价)`);
      response.push(`**👤 作者**: ${book.authors.join('、') || '未知'}`);
      response.push(`**🏢 出版社**: ${book.publisher || '未知'}`);
      response.push(`**📅 出版日期**: ${book.publishedDate || '未知'}`);
      response.push(`**📝 简介**: ${book.description?.slice(0, 200) || '暂无简介'}${book.description && book.description.length > 200 ? '...' : ''}`);
      response.push(`**💡 推荐理由**: 这本书符合您的阅读偏好，推荐您阅读。`);
      response.push('');
      response.push('---');
      response.push('');
    });
  } else {
    response.push(`抱歉，暂时没有找到符合"${preference}"的书籍。`);
    response.push('');
    response.push('💡 建议：');
    response.push('1. 尝试使用更具体的关键词');
    response.push('2. 稍后再试，AI 服务可能正在恢复');
    response.push('3. 浏览书库中的其他热门书籍');
  }

  return response.join('\n');
}

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
  console.log('=== Recommend Books API Called ===');

  try {
    const { preference } = await request.json();
    console.log('User preference:', preference);

    if (!preference || typeof preference !== 'string' || preference.trim().length === 0) {
      console.log('Error: Empty preference');
      return new Response(
        JSON.stringify({ error: '请输入您的阅读偏好' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 检查是否有 API Key
    const apiKey = process.env.COZE_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key prefix:', apiKey ? apiKey.substring(0, 10) + '...' : 'none');

    if (!apiKey) {
      console.log('No API Key found, using mock data');
      const mockResponse = getMockRecommendation(preference);
      return new Response(mockResponse, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        }
      });
    }

    console.log('Using AI API with Key...');

    // 尝试使用 AI 生成推荐
    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

      // 创建配置，传入 API Key
      const config = new Config({
        apiKey: apiKey,
      });

      const llmClient = new LLMClient(config, customHeaders);
      console.log('LLM Client created successfully');

      // AI 推荐的系统提示
      const recommendSystemPrompt = `你是一位专业的网文推荐助手。你的任务是根据用户的阅读偏好，推荐合适的网文小说。

请遵循以下规则：
1. 根据用户的描述推荐3-5本符合偏好的网文
2. 每本书包含：书名、作者、类型、一句话简介、推荐理由
3. 使用清晰的格式展示，便于用户快速浏览
4. 推荐理由要具体，说明为什么符合用户的偏好
5. 输出格式使用Markdown，每本书作为一个独立的章节
6. 不要编造不存在的书籍，推荐真实的、知名的作品

输出模板：
## 推荐理由
[简要说明为什么推荐这些类型的书籍]

## 书籍推荐

### 1. [书名]
- **作者**: [作者名]
- **类型**: [类型，如：古言、现言、权谋、热血成长、无限流、耽美等]
- **简介**: [一句话简介]
- **推荐理由**: [为什么推荐这本书，如何符合用户偏好]

---

[继续推荐其他书籍...]

请直接输出推荐内容，不要包含其他客套话。`;

      const recommendMessages = [
        { role: 'system' as const, content: recommendSystemPrompt },
        { role: 'user' as const, content: `用户阅读偏好：${preference}` }
      ];

      console.log('Sending request to LLM...');

      // 使用流式输出
      const stream = llmClient.stream(recommendMessages, {
        model: 'doubao-seed-1-8-251228',
        temperature: 0.8,
        thinking: 'disabled',
        caching: 'disabled'
      });

      console.log('Stream created successfully');

      // 创建可读流，流式输出AI生成的推荐
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            let chunkCount = 0;
            for await (const chunk of stream) {
              if (chunk.content) {
                const text = chunk.content.toString();
                chunkCount++;
                console.log(`Chunk ${chunkCount}:`, text.substring(0, 50) + '...');
                controller.enqueue(encoder.encode(text));
              }
            }
            console.log(`Total chunks: ${chunkCount}`);
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        }
      });

      console.log('Returning stream response');

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Transfer-Encoding': 'chunked'
        }
      });

    } catch (aiError) {
      console.error('AI API failed:', aiError);
      console.error('AI Error details:', JSON.stringify(aiError, null, 2));

      // 降级：使用模拟数据
      console.log('Falling back to mock data');
      const mockResponse = getMockRecommendation(preference);

      return new Response(mockResponse, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        }
      });
    }

  } catch (error) {
    console.error('Recommend Books API error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));

    return new Response(
      JSON.stringify({ error: '生成推荐失败，请重试' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
