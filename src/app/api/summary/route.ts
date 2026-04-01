import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: '请输入需要总结的章节内容' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是一位专业的网文阅读助手。你的任务是对网文章节内容进行结构化总结，帮助读者快速理解章节重点。

请遵循以下规则：
1. 提取章节的核心情节和关键事件
2. 识别重要人物及其关系变化
3. 总结主要冲突和悬念
4. 使用清晰的模块化结构展示
5. 突出章节的转折点和重要细节
6. 保持总结的简洁性，避免过长

输出模板：
# 📖 章节总结

## 核心情节
[用简练的语言概括本章节发生的主要事件]

## 关键人物
- **[人物名]**: [在本章中的行为、心理变化或重要对话]

## 重要冲突
[描述章节中的主要冲突或矛盾点]

## 悬念伏笔
[列出章节中埋下的伏笔或留下的悬念]

## 本章亮点
[本章最精彩或最值得关注的情节]

请直接输出总结内容，不要包含其他客套话。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `请总结以下章节内容：\n\n${text}` }
    ];

    // 使用流式输出
    const stream = client.stream(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.7,
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
              const textChunk = chunk.content.toString();
              controller.enqueue(encoder.encode(textChunk));
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
    console.error('Summary API error:', error);
    return new Response(
      JSON.stringify({ error: '生成总结失败，请重试' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
