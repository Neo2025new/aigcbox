'use client';

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// 页面进入动画变体
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// 渐变列表动画变体
const staggerVariants: Variants = {
  initial: { opacity: 0 },
  enter: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const itemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.9,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

// 页面包装器组件
export function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

// 渐变列表组件
export function StaggeredList({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <motion.div
      variants={staggerVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// 骨架屏组件
export function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div className={`bg-gray-200 rounded-lg overflow-hidden ${className || 'h-64'}`}>
      <motion.div
        className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
        animate={{
          x: [-200, 200],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

// 卡片骨架屏
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="animate-pulse">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="w-12 h-5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-1">
          <div className="w-full h-3 bg-gray-200 rounded"></div>
          <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// 优化后的加载动画
export function LoadingSpinner({ 
  size = 'default', 
  text = '加载中...' 
}: { 
  size?: 'sm' | 'default' | 'lg'; 
  text?: string; 
}) {
  const sizeClass = {
    sm: 'w-4 h-4',
    default: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center gap-3"
    >
      <Loader2 className={`${sizeClass} animate-spin text-primary`} />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-muted-foreground"
      >
        {text}
      </motion.p>
    </motion.div>
  );
}

// 结果展示动画容器
export function ResultContainer({ 
  children, 
  isVisible 
}: { 
  children: React.ReactNode; 
  isVisible: boolean; 
}) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ 
            opacity: 0, 
            scale: 0.95, 
            filter: 'blur(10px)' 
          }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            filter: 'blur(0px)' 
          }}
          exit={{ 
            opacity: 0, 
            scale: 1.05, 
            filter: 'blur(5px)' 
          }}
          transition={{ 
            duration: 0.5, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 浮动动作按钮
export function FloatingActionButton({ 
  children, 
  onClick, 
  className 
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  className?: string; 
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-full p-4 shadow-lg z-50 ${className}`}
    >
      {children}
    </motion.button>
  );
}

// 成功提示动画
export function SuccessToast({ 
  message, 
  isVisible, 
  onClose 
}: { 
  message: string; 
  isVisible: boolean; 
  onClose: () => void; 
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          onClick={onClose}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}