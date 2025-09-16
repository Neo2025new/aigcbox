'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
}

export function ResponsiveLayout({ sidebar, main }: ResponsiveLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 响应式检测
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg断点
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 移动端侧边栏切换
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto p-2 sm:p-4 max-w-[1600px]">
        {/* 移动端顶部菜单按钮 */}
        {isMobile && (
          <div className="lg:hidden mb-4 flex justify-between items-center">
            <h1 className="text-lg font-semibold text-gray-800">AI 图像工具箱</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMobileSidebar}
              className="lg:hidden"
            >
              {isMobileSidebarOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[500px_1fr] gap-4 lg:gap-6 h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)]">
          {/* 桌面端侧边栏 */}
          <div className="hidden lg:block h-full">
            {sidebar}
          </div>

          {/* 移动端侧边栏模态框 */}
          <AnimatePresence>
            {isMobile && isMobileSidebarOpen && (
              <>
                {/* 背景遮罩 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  onClick={toggleMobileSidebar}
                />
                
                {/* 侧边栏内容 */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'tween', duration: 0.3 }}
                  className="fixed left-0 top-0 h-full w-[85vw] max-w-sm bg-white shadow-xl z-50 lg:hidden overflow-hidden"
                >
                  <div className="h-full flex flex-col">
                    {/* 移动端侧边栏头部 */}
                    <div className="flex justify-between items-center p-4 border-b">
                      <h2 className="text-lg font-semibold">工具选择</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMobileSidebar}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* 侧边栏内容 */}
                    <div className="flex-1 overflow-hidden">
                      {sidebar}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* 主内容区域 */}
          <div className="h-full min-h-0">
            {main}
          </div>
        </div>
      </div>
    </div>
  );
}

// 响应式图片组件
export function ResponsiveImage({ 
  src, 
  alt, 
  className 
}: { 
  src: string; 
  alt: string; 
  className?: string; 
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-gray-100", className)}>
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-contain max-h-[40vh] sm:max-h-[60vh] lg:max-h-[80vh]"
        loading="lazy"
      />
    </div>
  );
}

// 响应式卡片容器
export function ResponsiveCard({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm border",
      "p-4 sm:p-6", // 响应式内边距
      className
    )}>
      {children}
    </div>
  );
}

// 响应式网格
export function ResponsiveGrid({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn(
      "grid gap-2 sm:gap-3 lg:gap-4",
      "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", // 响应式列数
      className
    )}>
      {children}
    </div>
  );
}