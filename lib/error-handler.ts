/**
 * 에러 처리 유틸리티
 * 
 * 애플리케이션 전반에서 발생하는 에러를 일관되게 처리하고,
 * 사용자에게 친화적인 메시지를 제공합니다.
 */

import { PostgrestError } from '@supabase/supabase-js';

/**
 * 에러 타입 정의
 */
export type AppError = 
  | NetworkError
  | SupabaseError
  | ValidationError
  | UnknownError;

export interface NetworkError {
  type: 'network';
  message: string;
  originalError?: Error;
}

export interface SupabaseError {
  type: 'supabase';
  message: string;
  code?: string;
  details?: string;
  originalError: PostgrestError;
}

export interface ValidationError {
  type: 'validation';
  message: string;
  field?: string;
  originalError?: Error;
}

export interface UnknownError {
  type: 'unknown';
  message: string;
  originalError?: Error;
}

/**
 * 에러를 애플리케이션 에러 타입으로 변환합니다.
 * 
 * @param error - 원본 에러
 * @returns 정규화된 애플리케이션 에러
 */
export function normalizeError(error: unknown): AppError {
  // 이미 정규화된 에러인 경우
  if (error && typeof error === 'object' && 'type' in error) {
    return error as AppError;
  }

  // Supabase 에러 처리
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as PostgrestError;
    return {
      type: 'supabase',
      message: getSupabaseErrorMessage(supabaseError),
      code: supabaseError.code,
      details: supabaseError.details,
      originalError: supabaseError,
    };
  }

  // 네트워크 에러 처리
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.',
      originalError: error,
    };
  }

  // 일반 에러 처리
  if (error instanceof Error) {
    return {
      type: 'unknown',
      message: error.message || '알 수 없는 오류가 발생했습니다.',
      originalError: error,
    };
  }

  // 알 수 없는 에러
  return {
    type: 'unknown',
    message: '알 수 없는 오류가 발생했습니다.',
    originalError: error instanceof Error ? error : undefined,
  };
}

/**
 * Supabase 에러 코드를 사용자 친화적인 메시지로 변환합니다.
 * 
 * @param error - Supabase 에러
 * @returns 사용자 친화적인 에러 메시지
 */
function getSupabaseErrorMessage(error: PostgrestError): string {
  // Supabase 에러 코드별 메시지 매핑
  const errorMessages: Record<string, string> = {
    'PGRST116': '요청한 데이터를 찾을 수 없습니다.',
    '23505': '이미 존재하는 데이터입니다.',
    '23503': '관련된 데이터가 없어 작업을 완료할 수 없습니다.',
    '42501': '권한이 없습니다.',
    '42P01': '데이터베이스 테이블을 찾을 수 없습니다.',
  };

  // 코드에 해당하는 메시지가 있으면 사용
  if (error.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }

  // 기본 메시지
  return error.message || '데이터베이스 작업 중 오류가 발생했습니다.';
}

/**
 * 에러를 사용자에게 표시할 수 있는 형식으로 변환합니다.
 * 
 * @param error - 애플리케이션 에러
 * @returns 사용자에게 표시할 메시지와 제목
 */
export function getUserFriendlyError(error: AppError): {
  title: string;
  description: string;
  action?: string;
} {
  switch (error.type) {
    case 'network':
      return {
        title: '네트워크 오류',
        description: error.message,
        action: '다시 시도',
      };

    case 'supabase':
      return {
        title: '데이터 저장 오류',
        description: error.message,
        action: '다시 시도',
      };

    case 'validation':
      return {
        title: '입력 오류',
        description: error.message,
      };

    case 'unknown':
      return {
        title: '오류 발생',
        description: error.message,
        action: '새로고침',
      };
  }
}

/**
 * 에러를 콘솔에 로깅합니다.
 * 프로덕션 환경에서는 에러 리포팅 서비스로 전송할 수 있습니다.
 * 
 * @param error - 애플리케이션 에러
 * @param context - 에러 발생 컨텍스트 정보
 */
export function logError(error: AppError, context?: Record<string, unknown>): void {
  const errorLog = {
    type: error.type,
    message: error.message,
    context,
    timestamp: new Date().toISOString(),
    ...(error.type === 'supabase' && {
      code: error.code,
      details: error.details,
    }),
    ...(error.originalError && {
      stack: error.originalError instanceof Error ? error.originalError.stack : undefined,
    }),
  };

  console.error('애플리케이션 에러:', errorLog);

  // 프로덕션 환경에서는 에러 리포팅 서비스로 전송
  // 예: Sentry.captureException(error.originalError, { extra: errorLog });
  
  if (process.env.NODE_ENV === 'production') {
    // TODO: 에러 리포팅 서비스 통합
    // Sentry.captureException(error.originalError || new Error(error.message), {
    //   extra: errorLog,
    // });
  }
}

/**
 * 에러가 복구 가능한지 확인합니다.
 * 
 * @param error - 애플리케이션 에러
 * @returns 복구 가능 여부
 */
export function isRecoverableError(error: AppError): boolean {
  switch (error.type) {
    case 'network':
      return true; // 네트워크 에러는 재시도 가능
    case 'supabase':
      // 일부 Supabase 에러는 복구 가능
      return error.code !== '42P01'; // 테이블 없음은 복구 불가
    case 'validation':
      return false; // 검증 에러는 사용자 수정 필요
    case 'unknown':
      return false; // 알 수 없는 에러는 복구 불가
  }
}
