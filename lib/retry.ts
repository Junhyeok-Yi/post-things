/**
 * 재시도 유틸리티
 * 
 * 네트워크 요청 실패 시 지수 백오프를 사용하여 자동으로 재시도합니다.
 */

import { NETWORK } from './constants';

/**
 * 재시도 옵션
 */
export interface RetryOptions {
  /** 최대 재시도 횟수 */
  maxRetries?: number;
  
  /** 초기 지연 시간 (밀리초) */
  initialDelay?: number;
  
  /** 최대 지연 시간 (밀리초) */
  maxDelay?: number;
  
  /** 재시도 가능한 에러인지 확인하는 함수 */
  shouldRetry?: (error: unknown) => boolean;
  
  /** 재시도 전에 호출되는 콜백 */
  onRetry?: (attempt: number, error: unknown) => void;
}

/**
 * 지수 백오프를 사용하여 함수를 재시도합니다.
 * 
 * @param fn - 실행할 비동기 함수
 * @param options - 재시도 옵션
 * @returns 함수 실행 결과
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => fetch('/api/data'),
 *   { maxRetries: 3 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = NETWORK.MAX_RETRIES,
    initialDelay = NETWORK.INITIAL_RETRY_DELAY,
    maxDelay = NETWORK.MAX_RETRY_DELAY,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 재시도 가능한 에러인지 확인
      if (!shouldRetry(error)) {
        throw error;
      }

      // 최대 재시도 횟수에 도달했으면 에러 발생
      if (attempt >= maxRetries) {
        throw error;
      }

      // 재시도 콜백 호출
      onRetry?.(attempt + 1, error);

      // 지수 백오프로 대기
      await sleep(delay);

      // 다음 재시도를 위한 지연 시간 증가 (지수 백오프)
      delay = Math.min(delay * 2, maxDelay);
    }
  }

  throw lastError;
}

/**
 * 지정된 시간만큼 대기합니다.
 * 
 * @param ms - 대기할 시간 (밀리초)
 * @returns Promise
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 네트워크 에러인지 확인합니다.
 * 
 * @param error - 확인할 에러
 * @returns 네트워크 에러인지 여부
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return error.message.includes('fetch') || error.message.includes('network');
  }
  
  if (error instanceof Error) {
    return error.message.includes('network') || error.message.includes('Network');
  }
  
  return false;
}

/**
 * 일시적인 에러인지 확인합니다.
 * 일시적인 에러는 재시도 가능합니다.
 * 
 * @param error - 확인할 에러
 * @returns 일시적인 에러인지 여부
 */
export function isTransientError(error: unknown): boolean {
  // 네트워크 에러는 일시적일 수 있음
  if (isNetworkError(error)) {
    return true;
  }

  // HTTP 5xx 에러는 일시적일 수 있음
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return status >= 500 && status < 600;
  }

  return false;
}
