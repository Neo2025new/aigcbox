'use client';

import { MessageSquare } from 'lucide-react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function PromptInput({ value, onChange, placeholder }: PromptInputProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <MessageSquare className="w-6 h-6" />
        自定义提示词
      </h2>
      
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || '描述您想要创建的图像...'}
        className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows={4}
      />
      
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-gray-500">快速提示：</span>
        {[
          '高清晰度',
          '专业摄影',
          '艺术风格',
          '梦幻效果',
          '写实风格',
          '柔和光线'
        ].map((tag) => (
          <button
            key={tag}
            onClick={() => onChange(value + (value ? ', ' : '') + tag)}
            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}