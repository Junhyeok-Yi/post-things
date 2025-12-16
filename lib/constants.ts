/**
 * 애플리케이션 전역 상수 정의
 * 
 * 매직 넘버와 하드코딩된 문자열을 상수로 관리하여
 * 코드의 가독성과 유지보수성을 향상시킵니다.
 */

/**
 * 제스처 관련 임계값
 * 스와이프, 드래그 등의 제스처 인식을 위한 최소 거리 및 속도 값
 */
export const GESTURE_THRESHOLDS = {
  /** 스와이프로 인식하기 위한 최소 거리 (픽셀) */
  SWIPE_MIN_DISTANCE: 30,
  
  /** 스와이프로 인식하기 위한 최소 속도 (픽셀/밀리초) */
  SWIPE_MIN_VELOCITY: 0.2,
  
  /** 드래그 액션 실행을 위한 최소 거리 (픽셀) */
  DRAG_ACTION_THRESHOLD: 80,
  
  /** 드래그 시작으로 인식하기 위한 최소 거리 (픽셀) */
  DRAG_START_THRESHOLD: 10,
  
  /** 핀치 인으로 인식하기 위한 최소 스케일 비율 */
  PINCH_IN_THRESHOLD: 0.7,
  
  /** 핀치 아웃으로 인식하기 위한 최소 스케일 비율 */
  PINCH_OUT_THRESHOLD: 1.3,
} as const;

/**
 * 메모 관련 제한값
 */
export const NOTE_LIMITS = {
  /** 메모 내용 최대 길이 (자) */
  MAX_CONTENT_LENGTH: 100,
  
  /** 메모 내용 최소 길이 (자) - 실시간 미리보기용 */
  MIN_PREVIEW_LENGTH: 2,
} as const;

/**
 * AI 분류 관련 설정
 */
export const AI_CATEGORIZATION = {
  /** 분류 최소 임계값 */
  MIN_THRESHOLD: 2,
  
  /** 실시간 미리보기 디바운스 지연 시간 (밀리초) */
  PREVIEW_DEBOUNCE_DELAY: 300,
} as const;

/**
 * 컨텍스트 분석 관련 설정
 */
export const CONTEXT_ANALYSIS = {
  /** 컨텍스트 분석을 위한 최근 시간 범위 (밀리초) */
  RECENT_TIME_RANGE: 60 * 60 * 1000, // 1시간
  
  /** 강한 컨텍스트로 판단하기 위한 최소 메모 개수 */
  MIN_MEMOS_FOR_STRONG_CONTEXT: 3,
  
  /** 강한 컨텍스트로 판단하기 위한 최소 신뢰도 */
  MIN_CONFIDENCE_FOR_STRONG_CONTEXT: 0.6,
  
  /** 개인 패턴 사용을 위한 최소 신뢰도 */
  MIN_CONFIDENCE_FOR_PERSONAL_PATTERN: 0.4,
} as const;

/**
 * 네트워크 관련 설정
 */
export const NETWORK = {
  /** API 요청 최대 재시도 횟수 */
  MAX_RETRIES: 3,
  
  /** 재시도 간 초기 지연 시간 (밀리초) */
  INITIAL_RETRY_DELAY: 1000,
  
  /** 최대 재시도 지연 시간 (밀리초) */
  MAX_RETRY_DELAY: 10000,
} as const;

/**
 * 애니메이션 관련 설정
 */
export const ANIMATION = {
  /** 기본 전환 시간 (밀리초) */
  DEFAULT_DURATION: 300,
  
  /** 피드백 표시 시간 (밀리초) */
  FEEDBACK_DURATION: 1000,
  
  /** 드래그 종료 후 원위치 복귀 시간 (밀리초) */
  DRAG_RESET_DURATION: 100,
} as const;

/**
 * 색상 매핑
 * 카테고리별 포스트잇 색상 정의
 */
export const COLOR_MAP = {
  yellow: 'bg-yellow-200',
  pink: 'bg-pink-200',
  blue: 'bg-blue-200',
  green: 'bg-green-200',
} as const;

/**
 * 카테고리별 색상 매핑
 */
export const CATEGORY_COLOR_MAP = {
  'To-Do': 'pink',
  '아이디어': 'blue',
  '메모': 'yellow',
} as const;

/**
 * LocalStorage 키
 */
export const STORAGE_KEYS = {
  /** 메모 데이터 저장 키 */
  STICKY_NOTES: 'sticky-notes',
  
  /** 메모 데이터 백업 키 */
  STICKY_NOTES_BACKUP: 'sticky-notes-backup',
  
  /** 사용자 토픽 패턴 저장 키 */
  USER_TOPIC_PATTERNS: 'user-topic-patterns',
} as const;
