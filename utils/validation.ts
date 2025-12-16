/**
 * 입력 검증 유틸리티
 * 
 * 사용자 입력을 검증하고 sanitize하여 XSS 공격 등을 방지합니다.
 * 메모 내용, 태그, 사용자 이름 등 모든 사용자 입력에 적용해야 합니다.
 */

/**
 * HTML 태그를 제거하는 간단한 sanitize 함수
 * 프로덕션에서는 DOMPurify 라이브러리 사용 권장
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // HTML 태그 제거
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // 위험한 프로토콜 제거 (javascript:, data:, vbscript: 등)
  sanitized = sanitized.replace(/(javascript|data|vbscript):/gi, '');
  
  // HTML 엔티티 이스케이프
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  return sanitized.trim();
}

/**
 * 메모 내용 검증 결과 타입
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

/**
 * 메모 내용 검증
 * 
 * @param content - 검증할 메모 내용
 * @param maxLength - 최대 글자 수 (기본: 100)
 * @returns 검증 결과
 */
export function validateNoteContent(
  content: string,
  maxLength: number = 100
): ValidationResult {
  // 1. 빈 문자열 체크
  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      error: '내용을 입력해주세요.',
    };
  }

  // 2. 공백 제거 후 sanitize
  const trimmed = content.trim();
  const sanitized = sanitizeInput(trimmed);

  // 3. 최소 길이 체크
  if (sanitized.length < 1) {
    return {
      isValid: false,
      error: '최소 1자 이상 입력해주세요.',
    };
  }

  // 4. 최대 길이 체크
  if (sanitized.length > maxLength) {
    return {
      isValid: false,
      error: `${maxLength}자 이내로 입력해주세요. (현재: ${sanitized.length}자)`,
    };
  }

  // 5. 악성 패턴 체크
  const maliciousPatterns = [
    /<script/i,           // <script> 태그
    /javascript:/i,       // javascript: 프로토콜
    /on\w+\s*=/i,        // onclick, onload 등 이벤트 핸들러
    /<iframe/i,          // <iframe> 태그
    /<object/i,          // <object> 태그
    /<embed/i,           // <embed> 태그
  ];

  for (const pattern of maliciousPatterns) {
    if (pattern.test(content)) {
      return {
        isValid: false,
        error: '허용되지 않는 문자가 포함되어 있습니다.',
      };
    }
  }

  // 6. 연속된 공백 체크 (선택적)
  const hasExcessiveWhitespace = /\s{10,}/.test(content);
  if (hasExcessiveWhitespace) {
    return {
      isValid: false,
      error: '과도한 공백이 포함되어 있습니다.',
    };
  }

  // 모든 검증 통과
  return {
    isValid: true,
    sanitizedValue: sanitized,
  };
}

/**
 * 이메일 주소 검증
 * 향후 인증 기능 추가 시 사용
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return {
      isValid: false,
      error: '이메일 주소를 입력해주세요.',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: '올바른 이메일 주소 형식이 아닙니다.',
    };
  }

  return {
    isValid: true,
    sanitizedValue: email.trim().toLowerCase(),
  };
}

/**
 * 비밀번호 강도 검증
 * 향후 인증 기능 추가 시 사용
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.length === 0) {
    return {
      isValid: false,
      error: '비밀번호를 입력해주세요.',
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: '비밀번호는 최소 8자 이상이어야 합니다.',
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      error: '비밀번호가 너무 깁니다.',
    };
  }

  // 비밀번호 강도 체크 (선택적)
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const strengthScore = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar]
    .filter(Boolean).length;

  if (strengthScore < 2) {
    return {
      isValid: false,
      error: '비밀번호는 영문 대소문자, 숫자, 특수문자 중 2가지 이상을 포함해야 합니다.',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * URL 검증
 * 향후 링크 공유 기능 추가 시 사용
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || url.trim().length === 0) {
    return {
      isValid: false,
      error: 'URL을 입력해주세요.',
    };
  }

  try {
    const urlObj = new URL(url);
    
    // HTTP(S)만 허용
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'HTTP 또는 HTTPS URL만 허용됩니다.',
      };
    }
    
    return {
      isValid: true,
      sanitizedValue: urlObj.href,
    };
  } catch (error) {
    return {
      isValid: false,
      error: '올바른 URL 형식이 아닙니다.',
    };
  }
}

/**
 * 태그 검증
 * 향후 태그 기능 추가 시 사용
 * 
 * @param tag - 검증할 태그 (#은 제외)
 */
export function validateTag(tag: string): ValidationResult {
  if (!tag || tag.trim().length === 0) {
    return {
      isValid: false,
      error: '태그를 입력해주세요.',
    };
  }

  const sanitized = sanitizeInput(tag.trim());

  // 최소/최대 길이
  if (sanitized.length < 1) {
    return {
      isValid: false,
      error: '태그는 최소 1자 이상이어야 합니다.',
    };
  }

  if (sanitized.length > 20) {
    return {
      isValid: false,
      error: '태그는 최대 20자까지 가능합니다.',
    };
  }

  // 허용된 문자만 사용 (한글, 영문, 숫자, 언더스코어)
  const tagRegex = /^[가-힣a-zA-Z0-9_]+$/;
  if (!tagRegex.test(sanitized)) {
    return {
      isValid: false,
      error: '태그는 한글, 영문, 숫자, 언더스코어(_)만 사용할 수 있습니다.',
    };
  }

  return {
    isValid: true,
    sanitizedValue: sanitized,
  };
}

/**
 * 파일 검증
 * 향후 이미지 첨부 기능 추가 시 사용
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number;           // 최대 파일 크기 (bytes)
    allowedTypes?: string[];    // 허용된 MIME 타입
  } = {}
): ValidationResult {
  const {
    maxSize = 5 * 1024 * 1024,  // 기본 5MB
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  } = options;

  // 파일 크기 체크
  if (file.size > maxSize) {
    const sizeMB = (maxSize / 1024 / 1024).toFixed(1);
    return {
      isValid: false,
      error: `파일 크기는 ${sizeMB}MB 이하여야 합니다.`,
    };
  }

  // MIME 타입 체크
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: '지원하지 않는 파일 형식입니다.',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * 범용 검증 함수
 * 여러 검증을 한 번에 수행
 */
export function validateMultiple(
  validations: ValidationResult[]
): ValidationResult {
  const firstError = validations.find(v => !v.isValid);
  
  if (firstError) {
    return firstError;
  }
  
  return { isValid: true };
}
