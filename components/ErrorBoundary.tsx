'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * 에러 바운더리 컴포넌트
 * 
 * React 컴포넌트 트리에서 발생하는 에러를 캐치하고,
 * 사용자에게 친화적인 에러 화면을 표시합니다.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * 에러가 발생했을 때 상태를 업데이트합니다.
   */
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  /**
   * 에러 정보를 로깅합니다.
   * 프로덕션 환경에서는 에러 리포팅 서비스로 전송할 수 있습니다.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('에러 바운더리에서 에러 캐치:', error, errorInfo);
    
    // 프로덕션 환경에서는 에러 리포팅 서비스로 전송
    // 예: Sentry.captureException(error, { extra: errorInfo });
    
    this.setState({
      error,
      errorInfo,
    });
  }

  /**
   * 에러 상태를 초기화하고 앱을 다시 로드합니다.
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * 페이지를 새로고침합니다.
   */
  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback UI가 제공된 경우 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-5">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            {/* 에러 아이콘 */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            {/* 에러 제목 */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              오류가 발생했습니다
            </h1>

            {/* 에러 메시지 */}
            <p className="text-gray-600 mb-6">
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요.
            </p>

            {/* 개발 환경에서만 상세 에러 정보 표시 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                <p className="text-sm font-mono text-red-600 break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer">
                      스택 트레이스 보기
                    </summary>
                    <pre className="mt-2 text-xs text-gray-500 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
