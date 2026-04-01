# AI网文阅读助手 - 项目文档

## 项目概述

AI网文阅读助手是一个基于Next.js 16和React 19构建的全栈Web应用，旨在通过AI技术为网文阅读用户提供智能化的阅读辅助服务。项目采用MVP/Demo模式，核心功能包括：

1. **AI找书推荐** - 基于用户自然语言偏好推荐网文
2. **章节总结** - 对章节内容进行智能摘要和结构化整理
3. **追更回顾** - 快速梳理前文剧情、人物关系和关键悬念

## 技术栈

### 前端框架
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **shadcn/ui** 组件库

### 后端集成
- **coze-coding-dev-sdk** v0.7.16
  - LLMClient: 流式AI对话生成
  - FetchClient: URL内容抓取
  - WebSearchClient: 联网搜索
- Google Books API: 书籍信息查询（可选，有降级方案）

### 核心特性
- ✅ AI流式输出（SSE协议）
- ✅ 智能降级机制（API失败时使用本地模拟数据或联网搜索）
- ✅ 前后端分离架构
- ✅ 响应式设计（支持移动端）
- ✅ 完整的TypeScript类型检查

## 项目结构

```
workspace/projects/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API路由
│   │   │   ├── recommend-books/
│   │   │   │   └── route.ts   # AI找书推荐接口
│   │   │   ├── summarize-chapter/
│   │   │   │   └── route.ts   # 章节总结接口
│   │   │   └── story-recap/
│   │   │       └── route.ts   # 追更回顾接口
│   │   ├── recommend/         # AI找书推荐页面
│   │   ├── summarize/         # 章节总结页面
│   │   ├── recap/            # 追更回顾页面
│   │   ├── page.tsx          # 首页（功能入口）
│   │   ├── layout.tsx        # 全局布局
│   │   └── globals.css       # 全局样式
│   ├── components/
│   │   ├── ui/               # shadcn/ui组件
│   │   └── markdown.tsx      # Markdown渲染组件
│   └── lib/
│       ├── book-library.ts   # 本地书库数据
│       └── utils.ts          # 工具函数
├── public/                   # 静态资源
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── .coze                    # 项目配置文件
```

## 核心功能实现

### 1. AI找书推荐

**接口**: `POST /api/recommend-books`

**输入**:
```typescript
{
  preference: string  // 用户的阅读偏好描述（自然语言）
}
```

**输出**: SSE流式响应，包含AI生成的推荐书籍列表

**实现逻辑**:
1. 调用WebSearchClient进行联网搜索网文推荐
2. 使用LLMClient基于搜索结果生成个性化推荐
3. 如果联网失败，降级到本地书库匹配
4. 流式输出推荐结果

**降级策略**:
- 首选：联网搜索 + AI生成
- 降级1：本地书库精确匹配（支持模糊搜索）
- 降级2：返回所有书库书籍（兜底）

### 2. 章节总结

**接口**: `POST /api/summarize-chapter`

**输入**:
```typescript
{
  content: string  // 章节文本内容
}
```

**输出**: SSE流式响应，包含结构化的章节总结

**实现逻辑**:
1. 使用LLMClient对章节内容进行分析
2. 提取关键情节、人物互动、核心观点
3. 生成结构化总结（带emoji标记）
4. 流式输出总结结果

### 3. 追更回顾

**接口**: `POST /api/story-recap`

**输入**:
```typescript
{
  query: string  // 回顾需求描述
}
```

**输出**: SSE流式响应，包含剧情梳理

**实现逻辑**:
1. 使用LLMClient分析用户需求
2. 联网搜索相关网文信息
3. 生成剧情回顾、人物关系梳理
4. 流式输出回顾结果

## 关键技术点

### AI流式输出实现

**后端**（SSE协议）:
```typescript
// 创建SSE流
const stream = new ReadableStream({
  async start(controller) {
    const encoder = new TextEncoder();
    try {
      for await (const chunk of llmClient.streamChatCompletion(...)) {
        const message = `data: ${JSON.stringify(chunk)}\n\n`;
        controller.enqueue(encoder.encode(message));
      }
    } finally {
      controller.close();
    }
  }
});

return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
  }
});
```

**前端**（增量渲染）:
```typescript
const response = await fetch('/api/xxx', {
  method: 'POST',
  body: JSON.stringify(data)
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // 解析SSE消息并增量更新UI
  // ...
}
```

### 智能降级机制

```typescript
// 找书推荐的降级逻辑
let books = null;
let fallbackReason = '';

try {
  // 方案1：联网搜索
  const searchResults = await webSearchClient.search(query);
  books = await aiGenerateRecommendations(searchResults);
  fallbackReason = '基于联网搜索和AI生成';
} catch (searchError) {
  console.error('联网搜索失败，降级到本地书库:', searchError);
  try {
    // 方案2：本地书库精确匹配
    books = matchBooksFromLibrary(query);
    fallbackReason = '基于本地书库匹配（联网搜索失败）';
  } catch (libraryError) {
    // 方案3：返回所有书籍（兜底）
    books = bookLibrary;
    fallbackReason = '返回全部书库书籍（精确匹配失败）';
  }
}
```

## 构建和测试命令

### 开发环境
```bash
# 安装依赖
pnpm install

# 启动开发服务器（端口5000）
pnpm dev
# 或使用Coze CLI
coze dev
```

### 类型检查
```bash
npx tsc --noEmit
```

### 构建生产版本
```bash
pnpm build
```

### 启动生产服务器
```bash
pnpm start
# 或使用Coze CLI
coze start
```

## API接口测试

### AI找书推荐
```bash
# 校园耽美文（触发联网搜索）
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"preference":"轻松校园耽美文"}' \
  http://localhost:5000/api/recommend-books

# 仙侠大女主（本地书库匹配）
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"preference":"仙侠大女主"}' \
  http://localhost:5000/api/recommend-books
```

### 章节总结
```bash
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"content":"章节文本内容..."}' \
  http://localhost:5000/api/summarize-chapter
```

### 追更回顾
```bash
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"query":"帮我回顾《XXX》前100章的主要剧情"}' \
  http://localhost:5000/api/story-recap
```

## 代码风格指南

### 组件规范
- 所有组件必须使用TypeScript编写
- 使用'use client'标记客户端组件
- Props接口必须明确类型定义
- 优先使用shadcn/ui组件库

### API路由规范
- 统一使用SSE协议返回流式响应
- 错误处理必须包含降级方案
- 所有外部调用必须有超时设置
- 日志记录关键操作和错误

### 命名规范
- 组件文件：PascalCase（如 `RecommendBooks.tsx`）
- 工具文件：kebab-case（如 `book-library.ts`）
- 变量/函数：camelCase
- 常量：UPPER_SNAKE_CASE

## 测试说明

### 类型检查（强制）
每次代码变更后必须运行：
```bash
npx tsc --noEmit
```
**禁止交付Build Failed的代码**

### 接口冒烟测试
所有API接口必须测试：
1. 正常流程（有效输入）
2. 降级流程（API失败）
3. 边界情况（空输入、超长输入）

### 服务存活探测
```bash
curl -I http://localhost:5000
```

## 安全注意事项

1. **API密钥管理**：所有API密钥通过环境变量获取，禁止硬编码
2. **输入验证**：所有用户输入必须进行长度和格式验证
3. **错误处理**：敏感信息（如API密钥、完整错误堆栈）禁止暴露给前端
4. **CORS配置**：仅允许必要的跨域请求

## 常见问题

### Q1: 为什么有时返回的是本地书库数据？
A: 这是智能降级机制。当联网搜索失败时，系统会自动降级到本地书库匹配，确保服务可用性。

### Q2: SSE流式输出中断怎么办？
A: 前端实现了自动重连和超时处理。如果长时间无响应，会显示错误提示并提供重试选项。

### Q3: 如何添加新的书库数据？
A: 编辑 `src/lib/book-library.ts` 文件，在 `bookLibrary` 数组中添加新的书籍对象。

### Q4: 如何调整AI生成的参数？
A: 在各API路由的 `llmClient.streamChatCompletion()` 调用中修改 `temperature`、`maxTokens` 等参数。

## 后续优化建议

1. **性能优化**：
   - 添加Redis缓存常见查询结果
   - 实现客户端请求去抖动

2. **功能增强**：
   - 支持用户上传书籍文件（PDF/EPUB）
   - 添加阅读历史记录功能
   - 实现个性化推荐算法

3. **UI/UX改进**：
   - 添加暗黑模式
   - 优化移动端交互体验
   - 增加更多动画效果

4. **监控和日志**：
   - 集成性能监控工具
   - 完善错误追踪和分析
   - 添加用户行为分析

## 联系方式

如有问题或建议，请通过项目Issue反馈。
