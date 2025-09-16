'use client';

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

// 屏幕阅读器友好的标题组件
export function AccessibleHeading({ 
  level, 
  children, 
  className,
  ...props 
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag 
      className={cn("scroll-mt-4", className)} 
      tabIndex={-1}
      {...props}
    >
      {children}
    </Tag>
  );
}

// 跳转到主内容链接
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50
                 transition-all duration-200"
    >
      跳转到主内容
    </a>
  );
}

// 无障碍按钮组件
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'default',
  ariaLabel,
  ariaDescribedBy,
  className,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
  [key: string]: any;
}) {
  const [isPressed, setIsPressed] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsPressed(true);
      onClick?.();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setIsPressed(false);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-pressed={isPressed}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'border border-input hover:bg-accent hover:text-accent-foreground': variant === 'outline',
          'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
        },
        {
          'h-9 px-3 text-sm': size === 'sm',
          'h-10 px-4 py-2': size === 'default',
          'h-11 px-8': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// 无障碍表单输入组件
export function AccessibleInput({
  id,
  label,
  error,
  required = false,
  description,
  type = 'text',
  className,
  ...props
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  type?: string;
  className?: string;
  [key: string]: any;
}) {
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  return (
    <div className="space-y-2">
      <label 
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="必填">*</span>}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      <input
        id={id}
        type={type}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={cn(
          description && descriptionId,
          error && errorId
        )}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        {...props}
      />
      
      {error && (
        <p id={errorId} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// 实时状态通知组件（屏幕阅读器）
export function LiveRegion({ 
  message, 
  politeness = 'polite' 
}: { 
  message: string; 
  politeness?: 'polite' | 'assertive' | 'off'; 
}) {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// 进度条组件（无障碍）
export function AccessibleProgressBar({ 
  value, 
  max = 100, 
  label,
  className 
}: { 
  value: number; 
  max?: number; 
  label: string;
  className?: string; 
}) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between text-sm mb-2">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div
        className="w-full bg-secondary rounded-full h-2"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// 模态对话框（无障碍）
export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // 保存当前焦点
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // 聚焦到模态框
      modalRef.current?.focus();
      
      // 禁用背景滚动
      document.body.style.overflow = 'hidden';
      
      // 捕获焦点
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
        
        // Tab键焦点管理
        if (e.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          if (focusableElements && focusableElements.length > 0) {
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
            
            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className={cn(
          "bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <h2 id="modal-title" className="text-xl font-semibold mb-4">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

// 颜色对比度检查Hook
export function useColorContrast() {
  const checkContrast = (foreground: string, background: string): number => {
    // 简化的对比度计算 - 实际应用中应使用更精确的算法
    const getLuminance = (color: string): number => {
      // 简化实现，实际应解析CSS颜色值
      return 0.5; // 占位符
    };
    
    const fgLum = getLuminance(foreground);
    const bgLum = getLuminance(background);
    
    return (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
  };
  
  const isAccessible = (contrast: number): boolean => {
    return contrast >= 4.5; // WCAG AA标准
  };
  
  return { checkContrast, isAccessible };
}

// 键盘导航辅助Hook
export function useKeyboardNavigation(items: any[], onSelect: (item: any) => void) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0) {
            onSelect(items[focusedIndex]);
          }
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(items.length - 1);
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, focusedIndex, onSelect]);
  
  return { focusedIndex, setFocusedIndex };
}