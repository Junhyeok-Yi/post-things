/**
 * 환경 변수 검증 모듈
 * 
 * 앱 시작 시 필수 환경 변수가 설정되어 있는지 확인합니다.
 * 누락된 환경 변수가 있으면 명확한 에러 메시지와 함께 앱 실행을 중단합니다.
 */

/**
 * 필수 환경 변수 목록
 */
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

/**
 * 선택적 환경 변수 (경고만 표시)
 */
const optionalEnvVars = [
  'NEXT_PUBLIC_SENTRY_DSN',           // Sentry 에러 추적 (향후 추가)
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',    // Google Analytics (향후 추가)
] as const;

/**
 * 환경 변수 타입 정의
 */
export interface Env {
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // 선택적 환경 변수
  sentryDsn?: string;
  gaMeasurementId?: string;
}

/**
 * 필수 환경 변수 검증
 * 누락된 환경 변수가 있으면 Error throw
 */
export function validateEnv(): void {
  const missing = requiredEnvVars.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    const errorMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ 환경 변수 설정 오류
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

다음 환경 변수가 설정되지 않았습니다:
${missing.map(key => `  - ${key}`).join('\n')}

해결 방법:
1. 프로젝트 루트에 .env.local 파일을 생성하세요
2. 다음 내용을 추가하세요:

${missing.map(key => `${key}=your-value-here`).join('\n')}

3. Supabase 설정이 필요하면 SUPABASE_SETUP.md를 참고하세요

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
    
    throw new Error(errorMessage);
  }

  // 선택적 환경 변수 경고
  const missingOptional = optionalEnvVars.filter(
    (key) => !process.env[key]
  );

  if (missingOptional.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(`
⚠️  선택적 환경 변수가 설정되지 않았습니다 (앱은 정상 작동):
${missingOptional.map(key => `  - ${key}`).join('\n')}
    `);
  }
}

/**
 * 타입 안전한 환경 변수 접근자
 * 환경 변수에 안전하게 접근할 수 있는 객체를 반환합니다
 */
export function getEnv(): Env {
  // 먼저 검증
  validateEnv();
  
  return {
    // 필수 환경 변수 (! 연산자 사용 - validateEnv에서 이미 확인됨)
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    
    // 선택적 환경 변수
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  };
}

/**
 * 특정 환경 변수 값 가져오기
 * 타입 안전한 방식으로 환경 변수에 접근
 */
export function getEnvVar(key: keyof Env): string | undefined {
  const env = getEnv();
  return env[key];
}

/**
 * 환경 변수가 설정되어 있는지 확인
 */
export function hasEnvVar(key: string): boolean {
  return !!process.env[key];
}

/**
 * 환경별 설정 헬퍼
 */
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

/**
 * 디버그 모드 확인
 * 개발 환경이거나 DEBUG=true인 경우
 */
export const isDebugMode = isDevelopment || process.env.DEBUG === 'true';

/**
 * 환경 변수 정보 출력 (개발 환경에서만)
 */
export function printEnvInfo(): void {
  if (!isDevelopment) return;
  
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 환경 설정 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

환경: ${process.env.NODE_ENV}

필수 환경 변수:
${requiredEnvVars.map(key => {
  const value = process.env[key];
  return `  ✅ ${key}: ${value ? '설정됨' : '❌ 미설정'}`;
}).join('\n')}

선택적 환경 변수:
${optionalEnvVars.map(key => {
  const value = process.env[key];
  return `  ${value ? '✅' : '⚠️ '} ${key}: ${value ? '설정됨' : '미설정'}`;
}).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}
