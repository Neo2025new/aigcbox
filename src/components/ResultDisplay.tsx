'use client';

import { Download, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface ResultDisplayProps {
  results: any;
  isLoading: boolean;
}

export default function ResultDisplay({ results, isLoading }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">生成结果</h3>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="mt-4 h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="mt-2 h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">生成结果</h3>
        <div className="text-center py-12 text-gray-500">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-gray-400" />
          </div>
          <p>等待生成...</p>
          <p className="text-sm mt-2">选择工具并点击生成按钮开始创作</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <h3 className="text-xl font-bold">生成结果</h3>
      
      {results.success && (
        <div className="space-y-4">
          {results.images && results.images.length > 0 ? (
            <div className="grid gap-4">
              {results.images.map((image: string, index: number) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`生成的图片 ${index + 1}`}
                    className="w-full rounded-lg border border-gray-200"
                  />
                  <button
                    className="absolute top-2 right-2 bg-white/90 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = image;
                      link.download = `generated-${index + 1}.png`;
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">优化后的提示词</h4>
              <p className="text-sm text-blue-800 mb-3">
                {results.generatedPrompt || results.originalPrompt}
              </p>
              <button
                onClick={() => handleCopy(results.generatedPrompt || results.originalPrompt)}
                className="flex items-center gap-2 text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    复制提示词
                  </>
                )}
              </button>
            </div>
          )}
          
          {results.message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">{results.message}</p>
            </div>
          )}
        </div>
      )}
      
      {results.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{results.error}</p>
        </div>
      )}
    </div>
  );
}

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);