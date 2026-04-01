'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Loader2, Copy, RotateCcw } from 'lucide-react';

export default function RecommendPage() {
  const [preference, setPreference] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!preference.trim()) {
      alert('请输入您的阅读偏好');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/recommend-books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preference }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '生成失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          setResult(prev => prev + text);

          // 自动滚动到底部
          if (resultRef.current) {
            resultRef.current.scrollTop = resultRef.current.scrollHeight;
          }
        }
      }
    } catch (error) {
      console.error('Generate error:', error);
      alert(error instanceof Error ? error.message : '生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
      alert('复制失败');
    }
  };

  const handleReset = () => {
    setPreference('');
    setResult('');
    setCopied(false);
  };

  // 将Markdown格式转换为HTML格式
  const formatResult = (markdown: string) => {
    return markdown
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-white">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3 text-gray-900 dark:text-white">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-white">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/- (.*$)/gim, '<li class="ml-6 my-1 text-gray-700 dark:text-gray-300">$1</li>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 头部导航 */}
        <Link href="/" className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回首页
        </Link>

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            AI 找书推荐
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            AI从真实书库检索书籍，基于真实信息生成个性化推荐
          </p>
        </div>

        {/* 主内容区 */}
        <div className="max-w-4xl mx-auto">
          {/* 输入区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              你的阅读偏好
            </label>
            <textarea
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              placeholder="例如：我想看轻松一点的古言，最好是甜宠文，不要太虐..."
              className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-all"
              disabled={loading}
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {preference.length} / 1000
              </span>
              <button
                onClick={handleGenerate}
                disabled={loading || !preference.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  '开始推荐'
                )}
              </button>
            </div>
          </div>

          {/* 结果区域 */}
          {result && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  推荐结果
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        复制
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    重新生成
                  </button>
                </div>
              </div>
              <div
                ref={resultRef}
                className="overflow-auto max-h-[600px] p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: formatResult(result) }}
              />
            </div>
          )}

          {/* 提示信息 */}
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            💡 提示：详细描述你的阅读偏好，可以获得更精准的推荐
          </div>
        </div>
      </div>
    </div>
  );
}
