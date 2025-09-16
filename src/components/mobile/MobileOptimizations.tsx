'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronUp, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 移动端底部抽屉组件
export function MobileBottomSheet({ 
  children, 
  title, 
  isOpen, 
  onToggle 
}: {
  children: React.ReactNode;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [dragY, setDragY] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const shouldClose = info.velocity.y > 500 || (info.velocity.y >= 0 && info.offset.y > 100);
    const shouldOpen = info.velocity.y < -500 || (info.velocity.y <= 0 && info.offset.y < -100);
    
    if (shouldClose && isOpen) {
      onToggle();
    } else if (shouldOpen && !isOpen) {
      onToggle();
    }
    
    setDragY(0);
  }, [isOpen, onToggle]);

  return (
    <>
      {/* 背景遮罩 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* 底部抽屉 */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-50 lg:hidden"
        initial={{ y: '100%' }}
        animate={{ 
          y: isOpen ? (isFullScreen ? 0 : '40%') : '95%' 
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.1, bottom: 0.1 }}
        onDrag={(event, info) => setDragY(info.offset.y)}
        onDragEnd={handleDragEnd}
        style={{ y: dragY }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* 拖拽把手 */}
        <div className="flex flex-col items-center py-2 px-4 border-b">
          <div className="w-12 h-1 bg-gray-300 rounded-full mb-2" />
          <div className="flex items-center justify-between w-full">
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullScreen(!isFullScreen)}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
              >
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {children}
        </div>
      </motion.div>
    </>
  );
}

// 移动端触摸优化的图片查看器
export function MobileImageViewer({ 
  src, 
  alt, 
  onClose 
}: { 
  src: string; 
  alt: string; 
  onClose: () => void; 
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // 双击缩放
  const handleDoubleTap = useCallback(() => {
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // 捏合缩放手势支持
  useEffect(() => {
    let initialDistance = 0;
    let initialScale = scale;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialScale = scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const newScale = Math.max(0.5, Math.min(3, initialScale * (currentDistance / initialDistance)));
        setScale(newScale);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [scale]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain"
        style={{
          scale,
          x: position.x,
          y: position.y,
        }}
        drag={scale > 1}
        dragConstraints={{
          top: -100 * (scale - 1),
          bottom: 100 * (scale - 1),
          left: -100 * (scale - 1),
          right: 100 * (scale - 1),
        }}
        onDrag={(event, info) => {
          if (scale > 1) {
            setPosition({ x: info.offset.x, y: info.offset.y });
          }
        }}
        onTap={handleDoubleTap}
        whileTap={{ scale: scale * 0.95 }}
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* 关闭按钮 */}
      <button
        className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-2 text-white"
        onClick={onClose}
      >
        ✕
      </button>
    </motion.div>
  );
}

// 移动端拖拽上传优化
export function MobileFriendlyDropzone({ 
  onDrop, 
  children, 
  className 
}: {
  onDrop: (files: File[]) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onDrop(files);
    }
  }, [onDrop]);

  return (
    <div className={cn("relative", className)}>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
      />
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg transition-all duration-200",
          isDragOver 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400"
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          
          const files = Array.from(e.dataTransfer.files);
          if (files.length > 0) {
            onDrop(files);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}

// 移动端虚拟键盘适配
export function useVirtualKeyboardHandler() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      // 检测虚拟键盘
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(heightDiff);
      }
    };

    updateViewportHeight();
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
    } else {
      window.addEventListener('resize', updateViewportHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
      } else {
        window.removeEventListener('resize', updateViewportHeight);
      }
    };
  }, []);

  return keyboardHeight;
}

// 移动端安全区域适配
export function SafeAreaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 设置CSS环境变量支持安全区域
    const style = document.createElement('style');
    style.innerHTML = `
      :root {
        --safe-area-inset-top: env(safe-area-inset-top);
        --safe-area-inset-right: env(safe-area-inset-right);
        --safe-area-inset-bottom: env(safe-area-inset-bottom);
        --safe-area-inset-left: env(safe-area-inset-left);
      }
      
      .safe-area-padding {
        padding-top: max(1rem, var(--safe-area-inset-top));
        padding-right: max(1rem, var(--safe-area-inset-right));
        padding-bottom: max(1rem, var(--safe-area-inset-bottom));
        padding-left: max(1rem, var(--safe-area-inset-left));
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return <>{children}</>;
}