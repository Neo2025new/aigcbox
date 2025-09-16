'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/AppContext';
import type { ToolConfig } from '@/lib/gemini';

interface ToolGridProps {
  tools: ToolConfig[];
  onSelectTool: (tool: ToolConfig) => void;
}

// 单个工具卡片组件 - 使用memo优化
const ToolCard = memo(function ToolCard({ 
  tool, 
  isSelected, 
  onSelect 
}: { 
  tool: ToolConfig; 
  isSelected: boolean; 
  onSelect: () => void; 
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      layout
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200",
          isSelected 
            ? "ring-2 ring-blue-500 bg-blue-50 shadow-md" 
            : "hover:shadow-md hover:scale-[1.01]"
        )}
        onClick={onSelect}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm flex items-center gap-2 truncate">
                {tool.requiresImage ? (
                  <ImageIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                )}
                {tool.name}
              </h4>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {tool.description}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
              {tool.caseNumber}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

// 主网格组件
export const ToolGrid = memo(function ToolGrid({ tools, onSelectTool }: ToolGridProps) {
  const { state } = useAppContext();

  // 使用useMemo优化工具列表渲染
  const toolItems = useMemo(() => 
    tools.map((tool) => (
      <ToolCard
        key={tool.id}
        tool={tool}
        isSelected={state.selectedTool?.id === tool.id}
        onSelect={() => onSelectTool(tool)}
      />
    )), 
    [tools, state.selectedTool?.id, onSelectTool]
  );

  if (tools.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-sm">没有找到匹配的工具</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {toolItems}
    </motion.div>
  );
});