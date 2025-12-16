/**
 * 에러 바운더리 컴포넌트
 * 
 * React 앱에서 발생하는 JavaScript 에러를 잡아내고 폴백 UI를 표시합니다.
 * 앱 전체가 크래시되는 것을 방지하고 사용자에게 친화적인 에러 메시지를 보여줍니다.
 */

'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * 에러가 발생했을 때 상태 업데이트
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * 에러 로깅 (향후 Sentry 등 에러 추적 서비스 연동 가능)
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // 향후 에러 추적 서비스로 전송
    // logError(error, { componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 폴백 UI가 있으면 그것을 사용, 없으면 기본 UI 표시
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <svg 
                    className="w-10 h-10 text-red-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                    />
                  </svg>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                문제가 발생했습니다
              </h2>
              
              <p className="text-gray-600 mb-6">
                일시적인 오류가 발생했습니다.
                <br />
                앱을 새로고침하거나 나중에 다시 시도해주세요.
              </p>
              
              {/* 개발 환경에서만 에러 메시지 표시 */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left bg-red-50 p-4 rounded-lg">
                  <summary className="cursor-pointer text-sm font-medium text-red-900 mb-2">
                    에러 상세 정보 (개발 모드)
                  </summary>
                  <pre className="text-xs text-red-800 overflow-auto">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                새로고침
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
