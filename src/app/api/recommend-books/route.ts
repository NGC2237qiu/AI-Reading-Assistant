import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { bookstoreService, Book } from '@/lib/bookstore';

/**
 * 获取模拟推荐（内联版本）
 */
function getMockRecommendation(preference: string): string {
  const lowerPreference = preference.toLowerCase();

  // 定义模拟数据库
  const mockDatabase: Record<string, { keywords: string[]; response: string }> = {
    '无限流': {
      keywords: ['无限流', '惊悚', '副本', '生存'],
      response: `## 推荐理由
以下推荐的5本无限流小说，都以"在不同副本/世界中生存"为核心设定，结合了惊悚、悬疑、成长和情感元素，符合你对无限流题材的阅读需求。

## 书籍推荐

### 1. 《无限恐怖》
- **作者**: zhttty
- **类型**: 无限流、惊悚、恐怖、成长
- **简介**: 郑吒被拉入主神空间，必须在不同的恐怖电影和游戏中完成任务，才能活下去并返回现实。
- **推荐理由**: 这是无限流的开山之作，经典中的经典。恐怖电影副本、团队协作、生死考验的设定开创了整个流派。

---

### 2. 《我在惊悚游戏里封神》
- **作者**: 壶鱼辣椒
- **类型**: 无限流、惊悚、耽美
- **简介**: 失业白柳进入一款死亡游戏，靠着极致的"骗术"和对人性的精准拿捏，从底层逆袭成游戏里的"邪神"。
- **推荐理由**: 主角白柳的"绝对利己"和"步步为营"让人大呼过瘾。副本设定新颖，感情线与主线完美融合。

---

### 3. 《惊悚乐园》
- **作者**: 三天两觉
- **类型**: 无限流、悬疑推理、游戏竞技
- **简介**: 封不觉在一款以恐惧为能源的虚拟游戏中，凭借超高智商和无厘头风格，破解各种谜题。
- **推荐理由**: 主角智商碾压，逻辑推理精彩绝伦。每个副本都有独特的设定和解谜过程，是智商流的代表作。

---

### 4. 《地球上线》
- **作者**: 莫晨欢
- **类型**: 无限流、生存、耽美
- **简介**: 全人类被拉入"地球上线"游戏，必须在各种危险游戏中生存，最终只有一个人能成为赢家。
- **推荐理由**: 将无限流与全球生存竞赛结合，世界观宏大，紧张刺激，主角的成长线非常精彩。

---

### 5. 《无限道武者路》
- **作者**: 无意归
- **类型**: 无限流、武侠、仙侠、热血
- **简介**: 主角在无限世界中不断修炼武道，最终超越凡人的极限，成为真正的武道强者。
- **推荐理由**: 将无限流与武侠修炼完美结合，主角通过在不同世界的历练不断提升自己，热血沸腾。
`
    },

    '耽美': {
      keywords: ['耽美', 'BL', '双男主'],
      response: `## 推荐理由
以下推荐的耽美小说，涵盖了不同题材和风格，从古代到现代，从甜宠到虐心，满足你对耽美文的阅读需求。

## 书籍推荐

### 1. 《伪装学渣》
- **作者**: 木瓜黄
- **类型**: 校园、甜宠、轻松搞笑
- **简介**: 两位大佬为了各自的原因伪装学渣，在校园里上演了一场"比菜"大戏。
- **推荐理由**: 全文充满沙雕笑点，没有虐恋剧情，轻松治愈，是校园耽美的经典之作。

---

### 2. 《天官赐福》
- **作者**: 墨香铜臭
- **类型**: 古代、仙侠、奇幻
- **简介**: 仙乐国太子谢怜在三次飞升后，遇到了绝境鬼王花城，两人开启了跨越八百年的羁绊。
- **推荐理由**: 世界观宏大，人物塑造深刻，情感描写细腻动人，是耽美仙侠文的经典之作。

---

### 3. 《默读》
- **作者**: Priest
- **类型**: 现代、悬疑、破案
- **简介**: 刑侦队长费渡和心理咨询师骆闻舟联手破案，在案件侦破中逐渐揭开彼此的秘密。
- **推荐理由**: 悬疑破案与情感线交织，案件设计精彩，人物刻画深刻，是 Priest 的代表作。

---

### 4. 《撒野》
- **作者**: 巫哲
- **类型**: 现代校园、现实向
- **简介**: 优等生蒋丞和"问题少年"顾飞在互相救赎中，找到属于自己的光和路。
- **推荐理由**: 现实向校园文，情感真挚，成长线动人，让人感受到青春的美好与无奈。

---

### 5. 《某某》
- **作者**: 木苏里
- **类型**: 校园、青春、成长
- **简介**: 江添和盛望因为家庭重组成为名义上的兄弟，在同一所高中里逐渐靠近。
- **推荐理由**: 文笔细腻温暖，把高中生活的细节写得真实动人，青春的纯粹感让人动容。
`
    },

    '古言': {
      keywords: ['古言', '古代言情', '宫廷', '王爷'],
      response: `## 推荐理由
以下推荐的古代言情小说，涵盖了宫廷、江湖、仙侠等多种题材，从权谋到甜宠，满足你对古言的阅读需求。

## 书籍推荐

### 1. 《琅琊榜》
- **作者**: 海宴
- **类型**: 古代、权谋、复仇
- **简介**: 梅长苏在幕后策划，扶持靖王登上皇位，为梅岭惨案复仇。
- **推荐理由**: 权谋布局精彩，人物智商在线，情感真挚，是权谋文的代表作。

---

### 2. 《甄嬛传》
- **作者**: 流潋紫
- **类型**: 宫廷、权谋、虐恋
- **简介**: 少女甄嬛从天真烂漫的少女成长为善于谋权的太后的故事。
- **推荐理由**: 经典宫斗小说，描写细腻，情节跌宕起伏，人物形象丰满，是宫斗文的标杆之作。

---

### 3. 《知否知否应是绿肥红瘦》
- **作者**: 关心则乱
- **类型**: 古代宅斗、家庭、言情
- **简介**: 明兰从庶女到当家主母的成长故事，展现了古代宅院的复杂人际关系。
- **推荐理由**: 宅斗文的代表作，描写细腻，人物塑造真实，展现了古代家族的生活百态。

---

### 4. 《凤囚凰》
- **作者**: 天衣有风
- **类型**: 穿越、宫廷、权谋
- **简介**: 现代女生穿越到南北朝，成为山阴公主，在宫廷斗争中周旋。
- **推荐理由**: 穿越宫廷文的经典之作，权谋斗争精彩，女主性格鲜明，感情线复杂又深刻。

---

### 5. 《扶摇》
- **作者**: 天下归元
- **类型**: 古代、成长、言情
- **简介**: 扶摇从底层小人物一路成长为女帝的故事，充满了热血和奋斗。
- **推荐理由**: 大女主成长文的经典，剧情跌宕起伏，女主形象鲜明，非常励志。
`
    },

    '甜宠': {
      keywords: ['甜宠', '甜文', '轻松', '治愈'],
      response: `## 推荐理由
以下推荐的甜宠小说，主打轻松治愈，没有虐心剧情，满足你对甜文的阅读需求。

## 书籍推荐

### 1. 《微微一笑很倾城》
- **作者**: 顾漫
- **类型**: 校园、网游、甜宠
- **简介**: 贝微微和肖奈在游戏中相识，现实中走到一起的甜蜜故事。
- **推荐理由**: 甜宠文的经典之作，全程撒糖，没有虐点，轻松治愈，让人看了心情变好。

---

### 2. 《你是我的荣耀》
- **作者**: 顾漫
- **类型**: 现代、电竞、甜宠
- **简介**: 途晶晶和于途在王者荣耀中重逢，重新走到一起的故事。
- **推荐理由**: 电竞题材的甜宠文，游戏描写专业，感情线甜蜜，是顾漫的又一力作。

---

### 3. 《杉杉来吃》
- **作者**: 顾漫
- **类型**: 现代、职场、甜宠
- **简介**: 普通员工薛杉杉被霸道总裁封腾"养着"的甜蜜日常。
- **推荐理由**: 霸道总裁爱上我的经典设定，但是甜度爆表，轻松搞笑，非常适合放松心情。

---

### 4. 《蜜汁炖鱿鱼》
- **作者**: 墨宝非宝
- **类型**: 现代、电竞、甜宠
- **简介**: 佟年（鱿小鱼）和韩商言的甜蜜爱情故事。
- **推荐理由**: 电竞甜宠文的代表作，女主可爱呆萌，男主外冷内热，全程高甜。

---

### 5. 《致我们单纯的小美好》
- **作者**: 赵乾乾
- **类型**: 校园、青春、甜宠
- **简介**: 陈小希和江辰从高中到大学的青春爱情故事。
- **推荐理由**: 青春校园甜宠文，纯真美好，让人回忆起校园时代的青涩爱情。
`
    }
  };

  // 检查是否匹配任何关键词
  for (const data of Object.values(mockDatabase)) {
    const hasKeyword = data.keywords.some(keyword =>
      lowerPreference.includes(keyword.toLowerCase())
    );

    if (hasKeyword) {
      return data.response;
    }
  }

  // 如果没有匹配的关键词，返回通用推荐
  return generateGenericRecommendation(preference);
}

/**
 * 生成通用推荐
 */
function generateGenericRecommendation(preference: string): string {
  return `## 推荐理由
根据您的阅读偏好"${preference}"，我们为您推荐以下书籍。这些书籍都是各类型中的优秀作品，值得您阅读。

## 书籍推荐

### 1. 《斗破苍穹》
- **作者**: 天蚕土豆
- **类型**: 玄幻、热血、成长
- **简介**: 萧炎从天才变成废物，又一步步重新崛起，最终成为斗帝的故事。
- **推荐理由**: 玄幻小说的经典之作，热血成长线非常精彩，打斗场面描写生动。

---

### 2. 《盗墓笔记》
- **作者**: 南派三叔
- **类型**: 悬疑、盗墓、冒险
- **简介**: 吴邪、张起灵、王胖子三人组一起下墓探险的故事。
- **推荐理由**: 盗墓题材的开山之作，悬疑设置精彩，人物关系复杂，让人欲罢不能。

---

### 3. 《全职高手》
- **作者**: 蝴蝶蓝
- **类型**: 电竞、网游、热血
- **简介**: 叶修在荣耀游戏中从零开始，重新成为顶尖高手的传奇故事。
- **推荐理由**: 电竞文的代表作，游戏描写专业，剧情热血，团队协作非常精彩。

---

### 4. 《何以笙箫默》
- **作者**: 顾漫
- **类型**: 现代、言情、治愈
- **简介**: 何以琛和赵默笙从相遇到分离再到重逢的感人爱情故事。
- **推荐理由**: 现代言情的经典之作，情感描写细腻，非常治愈人心。

---

### 5. 《三体》
- **作者**: 刘慈欣
- **类型**: 科幻、硬科幻
- **简介**: 地球文明与三体文明的碰撞与对决。
- **推荐理由**: 中国科幻的巅峰之作，想象力丰富，哲学思考深刻，是必读的经典。

---

💡 提示：如果您希望获得更精准的推荐，可以尝试更具体的关键词，如"古言甜宠"、"无限流耽美"等。
`;
}

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

    // 检查环境变量
    const apiKey = process.env.COZE_API_KEY || process.env.OPENAI_API_KEY;
    console.log('COZE_API_KEY exists:', !!process.env.COZE_API_KEY);
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('Using API Key from:', process.env.COZE_API_KEY ? 'COZE_API_KEY' : process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY' : 'none');

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

      // 创建配置，SDK 会自动从环境变量加载 API Key
      const config = new Config();

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
