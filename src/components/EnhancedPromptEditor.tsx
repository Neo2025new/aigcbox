'use client';

import { useState, useEffect } from 'react';
import { Copy, RotateCcw, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EnhancedPromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  label?: string;
}

export default function EnhancedPromptEditor({
  value,
  onChange,
  maxLength = 1000,
  placeholder = '描述你想要生成的图像...',
  label = '最终提示词'
}: EnhancedPromptEditorProps) {
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [warning, setWarning] = useState('');

  useEffect(() => {
    const count = value.length;
    setCharCount(count);
    
    if (count > maxLength * 0.9) {
      setWarning(`接近字符限制 (${count}/${maxLength})`);
    } else if (count < 3 && count > 0) {
      setWarning('提示词太短，建议至少3个字符');
    } else {
      setWarning('');
    }
  }, [value, maxLength]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleReset = () => {
    onChange('');
  };

  const getCharCountColor = () => {
    const ratio = charCount / maxLength;
    if (ratio > 0.9) return 'text-red-500';
    if (ratio > 0.7) return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="final-prompt">{label}</Label>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${getCharCountColor()}`}>
            {charCount}/{maxLength}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!value}
            className="h-7 px-2"
          >
            <Copy className="w-3 h-3 mr-1" />
            {copied ? '已复制' : '复制'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={!value}
            className="h-7 px-2"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            重置
          </Button>
        </div>
      </div>
      
      <textarea
        id="final-prompt"
        className="w-full min-h-[100px] p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      
      {warning && (
        <Alert className="py-2">
          <AlertCircle className="h-3 w-3" />
          <AlertDescription className="text-xs">
            {warning}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <div>
          <p>提示词建议：</p>
          <ul className="mt-1 space-y-0.5 list-disc list-inside">
            <li>使用详细的描述获得更好的结果</li>
            <li>指定风格（如：油画、水彩、摄影等）</li>
            <li>描述光线、角度和氛围</li>
            <li>避免敏感或不当内容</li>
          </ul>
        </div>
      </div>
    </div>
  );
}