'use client';

import React, { memo, useCallback, useMemo, Suspense } from 'react';
import { ALL_TOOLS } from '@/lib/gemini';
import { useAppContext } from '@/contexts/AppContext';
import { ResponsiveLayout } from './ResponsiveLayout';
import { AnimatedPage, StaggeredList, LoadingSpinner } from './AnimationComponents';
import { SkipToContent } from '@/components/accessibility/AccessibilityComponents';
import { ToolGrid } from './ToolGrid';
import { ErrorBoundary } from './ErrorBoundary';

// 懒加载的组件
const ToolConfigPanel = React.lazy(() => import('./ToolConfigPanel'));
const ResultsPanel = React.lazy(() => import('./ResultsPanel'));
const ToolSearchAndFilter = React.lazy(() => import('./ToolSearchAndFilter'));

// 主页面组件 - 使用memo优化
export const OptimizedMainPage = memo(function OptimizedMainPage() {
  const { state, dispatch } = useAppContext();

  // 使用useMemo缓存筛选后的工具列表
  const filteredTools = useMemo(() => {
    return ALL_TOOLS.filter(tool => {
      const matchesCategory = state.selectedCategory === 'all' || tool.category === state.selectedCategory;
      const matchesSearch = !state.searchQuery || 
        tool.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(state.searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [state.selectedCategory, state.searchQuery]);

  // 使用useCallback优化事件处理函数
  const handleSelectTool = useCallback((tool: any) => {
    dispatch({ type: 'SET_SELECTED_TOOL', payload: tool });
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'config' });
    dispatch({ type: 'SET_RESULTS', payload: null });
    dispatch({ type: 'SET_ERROR', payload: '' });
    
    // 更新最终提示词
    const prompt = tool.promptTemplate(state.customPrompt, {});
    dispatch({ type: 'SET_FINAL_PROMPT', payload: prompt });
  }, [dispatch, state.customPrompt]);

  const handleSearch = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, [dispatch]);

  const handleCategoryChange = useCallback((category: string) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });
  }, [dispatch]);

  // 侧边栏内容
  const sidebarContent = useMemo(() => (
    <div className="h-full flex flex-col">
      <ErrorBoundary fallback={<div>搜索组件加载失败</div>}>
        <Suspense fallback={<LoadingSpinner size="sm" text="加载搜索..." />}>
          <ToolSearchAndFilter
            searchQuery={state.searchQuery}
            selectedCategory={state.selectedCategory}
            onSearch={handleSearch}
            onCategoryChange={handleCategoryChange}
          />
        </Suspense>
      </ErrorBoundary>

      <div className="flex-1 overflow-hidden mt-4">
        <ErrorBoundary fallback={<div>工具列表加载失败</div>}>
          <StaggeredList className="h-full overflow-y-auto custom-scrollbar px-2">
            <ToolGrid
              tools={filteredTools}
              onSelectTool={handleSelectTool}
            />
          </StaggeredList>
        </ErrorBoundary>
      </div>

      {state.selectedTool && (
        <div className="border-t pt-4 mt-4">
          <ErrorBoundary fallback={<div>配置面板加载失败</div>}>
            <Suspense fallback={<LoadingSpinner size="sm" text="加载配置..." />}>
              <ToolConfigPanel />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}
    </div>
  ), [
    state.searchQuery,
    state.selectedCategory,
    state.selectedTool,
    filteredTools,
    handleSearch,
    handleCategoryChange,
    handleSelectTool
  ]);

  // 主内容区域
  const mainContent = useMemo(() => (
    <div id="main-content" tabIndex={-1} className="h-full flex flex-col">
      <ErrorBoundary fallback={<div>结果面板加载失败</div>}>
        <Suspense fallback={<LoadingSpinner text="加载结果面板..." />}>
          <ResultsPanel />
        </Suspense>
      </ErrorBoundary>
    </div>
  ), []);

  return (
    <AnimatedPage>
      <SkipToContent />
      <ResponsiveLayout
        sidebar={sidebarContent}
        main={mainContent}
      />
    </AnimatedPage>
  );
});

export default OptimizedMainPage;