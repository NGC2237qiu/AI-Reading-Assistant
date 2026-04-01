import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { query, context } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: '请输入您的回顾问题' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是一位专业的网文阅读助手。你的任务是帮助用户回顾网文剧情，快速梳理前文内容、人物关系和关键情节。

请遵循以下规则：
1. 根据用户的问题提供清晰、准确的剧情回顾
2. 重点梳理相关人物关系和情节脉络
3. 帮助用户快速回忆关键事件和转折点
4. 如果用户提供背景信息（context），基于这些信息进行回顾
5. 使用清晰的结构展示信息，便于快速浏览
6. 突出用户可能遗忘或混淆的关键点

输出模板：
# 📚 剧情回顾

## 剧情梳理
[根据用户问题，梳理相关情节的发展脉络]

## 人物关系
- **[人物A]**: 与[人物B]的关系是[关系描述]
- **[人物C]**: 在剧情中的作用是[作用描述]
- [其他重要人物关系...]

## 关键事件
- **事件1**: [简要描述事件内容]
- **事件2**: [简要描述事件内容]
- [其他关键事件...]

## 当前进度
[如果可能，描述当前的剧情进展或状态]

## 温馨提示
[提醒用户接下来可能需要注意的情节或人物]

请直接输出回顾内容，不要包含其他客套话。如果用户问题不够明确，可以先引导用户提供更多背景信息。`;

    const userPrompt = context 
      ? `背景信息：\n${context}\n\n问题：${query}`
      : query;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
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
    console.error('Recap API error:', error);
    return new Response(
      JSON.stringify({ error: '生成回顾失败，请重试' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
