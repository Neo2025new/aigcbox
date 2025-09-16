'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronRight, Sparkles, Image as ImageIcon, Grid3x3 } from 'lucide-react';
import { ALL_TOOLS, TOOL_CATEGORIES, getToolsByCategory, searchTools, ToolConfig } from '@/lib/gemini';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

interface ToolSelectorProps {
  selectedTool: string;
  onToolSelect: (toolId: string) => void;
}

export default function AdvancedToolSelector({ selectedTool, onToolSelect }: ToolSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  // 获取所有分类
  const categories = useMemo(() => {
    const cats = new Set<string>();
    ALL_TOOLS.forEach(tool => cats.add(tool.category));
    return ['all', ...Array.from(cats)];
  }, []);

  // 根据搜索和分类筛选工具
  const filteredTools = useMemo(() => {
    let tools = ALL_TOOLS;

    // 按分类筛选
    if (selectedCategory !== 'all') {
      tools = tools.filter(tool => tool.category === selectedCategory);
    }

    // 按搜索词筛选
    if (searchQuery) {
      const searchResults = searchTools(searchQuery);
      tools = tools.filter(tool => searchResults.some(r => r.id === tool.id));
    }

    return tools;
  }, [searchQuery, selectedCategory]);

  // 按分类分组工具
  const groupedTools = useMemo(() => {
    const groups: Record<string, ToolConfig[]> = {};
    filteredTools.forEach(tool => {
      if (!groups[tool.category]) {
        groups[tool.category] = [];
      }
      groups[tool.category].push(tool);
    });
    return groups;
  }, [filteredTools]);

  const handleToolClick = (toolId: string) => {
    if (expandedTool === toolId) {
      setExpandedTool(null);
    } else {
      setExpandedTool(toolId);
    }
    onToolSelect(toolId);
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Grid3x3 className="w-4 h-4" />
          选择工具 ({filteredTools.length}/{ALL_TOOLS.length})
        </CardTitle>
        
        {/* 搜索框 */}
        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
          <Input
            type="text"
            placeholder="搜索工具..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-sm"
          />
        </div>

        {/* 分类标签 - 可滚动 */}
        <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
          {categories.map(category => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap text-xs px-2 py-0.5"
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? '全部' : category}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-3 pb-3">
          <AnimatePresence>
            {selectedCategory === 'all' ? (
              // 显示分组的工具
              Object.entries(groupedTools).map(([category, tools]) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-3"
                >
                  <h3 className="text-xs font-semibold text-gray-500 mb-2 px-1">{category}</h3>
                  <div className="grid grid-cols-1 gap-1">
                    {tools.map(tool => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        isSelected={selectedTool === tool.id}
                        isExpanded={expandedTool === tool.id}
                        onClick={() => handleToolClick(tool.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              // 显示单个分类的工具
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="grid grid-cols-1 gap-2">
                  {filteredTools.map(tool => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      isSelected={selectedTool === tool.id}
                      isExpanded={expandedTool === tool.id}
                      onClick={() => handleToolClick(tool.id)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {filteredTools.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>没有找到匹配的工具</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface ToolCardProps {
  tool: ToolConfig;
  isSelected: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

function ToolCard({ tool, isSelected, isExpanded, onClick }: ToolCardProps) {
  return (
    <motion.div
      layout
      className={`
        p-3 rounded-lg cursor-pointer transition-all
        ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}
        border ${isSelected ? 'border-blue-300' : 'border-gray-200'}
      `}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {tool.requiresImage ? (
              <ImageIcon className="w-4 h-4 text-gray-500" />
            ) : (
              <Sparkles className="w-4 h-4 text-yellow-500" />
            )}
            <h4 className="font-medium text-sm">{tool.name}</h4>
            <Badge variant="secondary" className="text-xs">
              {tool.caseNumber}
            </Badge>
          </div>
          <p className="text-xs text-gray-600 mt-1">{tool.description}</p>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-gray-200"
          >
            {/* 显示参数信息 */}
            {tool.parameters && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">需要的参数：</p>
                <div className="space-y-1">
                  {Object.entries(tool.parameters).map(([key, param]) => (
                    <div key={key} className="text-xs">
                      <span className="font-medium">{param.label}</span>
                      {param.required && (
                        <Badge variant="outline" className="ml-1 text-xs scale-75">
                          必填
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 显示图片要求 */}
            <div className="flex gap-2 text-xs">
              {tool.requiresImage && (
                <Badge variant="outline" className="text-xs">
                  需要上传图片
                </Badge>
              )}
              {tool.requiresMultipleImages && (
                <Badge variant="outline" className="text-xs">
                  支持多张图片
                </Badge>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}