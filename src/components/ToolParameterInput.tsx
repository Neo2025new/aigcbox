'use client';

import { useState, useEffect } from 'react';
import { ToolConfig } from '@/lib/gemini';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ToolParameterInputProps {
  tool: ToolConfig | null;
  onParametersChange: (params: Record<string, string>) => void;
}

export default function ToolParameterInput({ tool, onParametersChange }: ToolParameterInputProps) {
  const [parameters, setParameters] = useState<Record<string, string>>({});

  // 重置参数当工具改变时
  useEffect(() => {
    setParameters({});
    onParametersChange({});
  }, [tool?.id, onParametersChange]);

  if (!tool) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">工具参数</CardTitle>
          <CardDescription>选择一个工具后，在这里配置参数</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">请先选择一个工具</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleParameterChange = (key: string, value: string) => {
    const newParams = { ...parameters, [key]: value };
    setParameters(newParams);
    onParametersChange(newParams);
  };

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {tool.requiresImage ? (
                <ImageIcon className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4 text-yellow-500" />
              )}
              {tool.name}
            </CardTitle>
            <CardDescription className="mt-1">{tool.description}</CardDescription>
          </div>
          <Badge variant="secondary" className="ml-2">
            {tool.caseNumber}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 图片要求提示 */}
        {(tool.requiresImage || tool.requiresMultipleImages) && (
          <Alert className="py-2">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {tool.requiresMultipleImages 
                ? '此工具需要上传多张图片'
                : '此工具需要上传至少一张图片'}
            </AlertDescription>
          </Alert>
        )}

        {/* 参数输入区域 */}
        {tool.parameters && Object.keys(tool.parameters).length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">填写参数：</h4>
            {Object.entries(tool.parameters).map(([key, param]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-sm flex items-center gap-1">
                  {param.label}
                  {param.required && (
                    <Badge variant="outline" className="text-xs scale-75">
                      必填
                    </Badge>
                  )}
                </Label>
                <Input
                  id={key}
                  type="text"
                  placeholder={param.placeholder}
                  value={parameters[key] || ''}
                  onChange={(e) => handleParameterChange(key, e.target.value)}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600 py-4">
            <p>此工具不需要额外参数</p>
            {!tool.requiresImage && (
              <p className="mt-2 text-xs text-gray-500">
                直接点击生成按钮即可使用
              </p>
            )}
          </div>
        )}

        {/* 提示信息 */}
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500">
            {tool.parameters && Object.keys(tool.parameters).length > 0
              ? '💡 提示：填写参数可以让生成结果更精确'
              : '💡 提示：可以在下方自定义提示词框中添加额外描述'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}