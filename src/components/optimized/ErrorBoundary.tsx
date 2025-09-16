'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // 在开发环境下记录详细错误信息
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught an Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，则使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <Card className="m-4 border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <CardTitle className="text-red-900">出现了错误</CardTitle>
            </div>
            <CardDescription className="text-red-700">
              很抱歉，这个组件遇到了问题。您可以尝试刷新页面或联系技术支持。
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* 开发环境下显示错误详情 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="bg-white p-3 rounded border text-sm">
                <summary className="cursor-pointer font-medium text-red-800 mb-2">
                  错误详情 (仅开发环境可见)
                </summary>
                <div className="space-y-2 text-xs">
                  <div>
                    <strong>错误信息:</strong>
                    <pre className="mt-1 bg-gray-100 p-2 rounded overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </div>
                  <div>
                    <strong>错误栈:</strong>
                    <pre className="mt-1 bg-gray-100 p-2 rounded overflow-auto text-xs">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>组件栈:</strong>
                      <pre className="mt-1 bg-gray-100 p-2 rounded overflow-auto text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={this.handleReset}
                variant="outline"
                size="sm"
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                重试
              </Button>
              
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                刷新页面
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook版本的错误边界（用于函数组件内部错误处理）
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    console.error('useErrorHandler caught an error:', error);
  }, []);

  // 如果有错误，抛出它以便被ErrorBoundary捕获
  if (error) {
    throw error;
  }

  return { handleError, resetError };
}