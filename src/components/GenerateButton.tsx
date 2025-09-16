'use client';

import { Sparkles } from 'lucide-react';

interface GenerateButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function GenerateButton({ onClick, isLoading, disabled }: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        w-full py-4 px-6 rounded-lg font-semibold text-white
        transition-all duration-200 transform
        ${disabled || isLoading
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-105 hover:shadow-lg'
        }
      `}
    >
      <div className="flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>生成中...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>开始生成</span>
          </>
        )}
      </div>
    </button>
  );
}