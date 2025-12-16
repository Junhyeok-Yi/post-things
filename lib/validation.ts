/**
 * 입력 검증 유틸리티
 * 
 * 사용자 입력을 검증하고, 보안을 강화합니다.
 * XSS 공격 방지 및 데이터 무결성을 보장합니다.
 */

import { NOTE_LIMITS } from './constants';

/**
 * 검증 결과 타입
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * 메모 내용을 검증합니다.
 * 
 * @param content - 검증할 메모 내용
 * @returns 검증 결과
 * 
 * @example
 * ```typescript
 * const result = validateNoteContent('안녕하세요');
 * if (result.isValid) {
 *   // 검증 통과
 * }
 * ```
 */
export function validateNoteContent(content: string): ValidationResult {
  // 빈 문자열 체크
  if (!content || typeof content !== 'string') {
    return {
      isValid: false,
      error: '메모 내용을 입력해주세요.',
    };
  }

  // 길이 체크
  if (content.length > NOTE_LIMITS.MAX_CONTENT_LENGTH) {
    return {
      isValid: false,
      error: `메모는 ${NOTE_LIMITS.MAX_CONTENT_LENGTH}자 이하여야 합니다.`,
    };
  }

  if (content.trim().length === 0) {
    return {
      isValid: false,
      error: '메모 내용을 입력해주세요.',
    };
  }

  // XSS 방지: HTML 태그 제거
  const sanitized = sanitizeInput(content);

  // 특수 문자 체크 (필요시)
  // 예: SQL 인젝션 방지 등

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * 입력 문자열에서 잠재적으로 위험한 문자를 제거합니다.
 * 
 * @param input - 입력 문자열
 * @returns 정제된 문자열
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // HTML 태그 제거
  let sanitized = input.replace(/<[^>]*>/g, '');

  // 위험한 JavaScript 이벤트 핸들러 제거
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // 특수 문자 이스케이프 (필요시)
  // sanitized = sanitized.replace(/[<>'"]/g, '');

  return sanitized.trim();
}

/**
 * UUID 형식을 검증합니다.
 * 
 * @param id - 검증할 ID
 * @returns 유효한 UUID인지 여부
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * 카테고리 값이 유효한지 확인합니다.
 * 
 * @param category - 검증할 카테고리
 * @returns 유효한 카테고리인지 여부
 */
export function isValidCategory(category: string): category is 'To-Do' | '메모' | '아이디어' {
  return ['To-Do', '메모', '아이디어'].includes(category);
}

/**
 * 색상 값이 유효한지 확인합니다.
 * 
 * @param color - 검증할 색상
 * @returns 유효한 색상인지 여부
 */
export function isValidColor(color: string): color is 'yellow' | 'pink' | 'blue' | 'green' {
  return ['yellow', 'pink', 'blue', 'green'].includes(color);
}

/**
 * StickyNote 객체를 검증합니다.
 * 
 * @param note - 검증할 노트 객체
 * @returns 검증 결과
 */
export function validateStickyNote(note: unknown): ValidationResult & { note?: unknown } {
  if (!note || typeof note !== 'object') {
    return {
      isValid: false,
      error: '유효하지 않은 노트 데이터입니다.',
    };
  }

  const noteObj = note as Record<string, unknown>;

  // 필수 필드 체크
  if (!noteObj.id || typeof noteObj.id !== 'string' || !isValidUUID(noteObj.id)) {
    return {
      isValid: false,
      error: '유효하지 않은 노트 ID입니다.',
    };
  }

  if (!noteObj.content || typeof noteObj.content !== 'string') {
    return {
      isValid: false,
      error: '노트 내용이 필요합니다.',
    };
  }

  // 내용 검증
  const contentValidation = validateNoteContent(noteObj.content);
  if (!contentValidation.isValid) {
    return contentValidation;
  }

  // 카테고리 검증
  if (!noteObj.category || !isValidCategory(noteObj.category as string)) {
    return {
      isValid: false,
      error: '유효하지 않은 카테고리입니다.',
    };
  }

  // 색상 검증
  if (!noteObj.color || !isValidColor(noteObj.color as string)) {
    return {
      isValid: false,
      error: '유효하지 않은 색상입니다.',
    };
  }

  return {
    isValid: true,
    note: {
      ...noteObj,
      content: contentValidation.sanitized || noteObj.content,
    },
  };
}
