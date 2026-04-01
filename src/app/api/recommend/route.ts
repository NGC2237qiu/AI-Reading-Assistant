import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

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
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是一位专业的网文推荐助手。你的任务是根据用户的阅读偏好推荐合适的网文小说。

请遵循以下规则：
1. 根据用户的描述推荐3-5本符合偏好的网文
2. 每本书包含：书名、作者、类型、一句话简介、推荐理由
3. 使用清晰的格式展示，便于用户快速浏览
4. 推荐理由要具体，说明为什么符合用户的偏好
5. 如果用户偏好比较模糊，可以先询问补充信息
6. 输出格式使用Markdown，每本书作为一个独立的章节

输出模板：
## 1. [书名]
- **作者**: [作者名]
- **类型**: [类型，如：古言、现言、权谋、热血成长等]
- **简介**: [一句话简介]
- **推荐理由**: [为什么推荐这本书，如何符合用户偏好]

请直接输出推荐结果，不要包含其他客套话。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: preference }
    ];

    // 使用流式输出
    const stream = client.stream(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.8,
      thinking: 'disabled',
      caching: 'disabled'
    });

    // 创建可读流
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
    console.error('Recommend API error:', error);
    return new Response(
      JSON.stringify({ error: '生成推荐失败，请重试' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
