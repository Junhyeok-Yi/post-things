// 포스트잇 관련 타입 정의
export interface StickyNote {
  id: string;
  content: string;
  category: 'To-Do' | '메모' | '아이디어';
  color: 'yellow' | 'pink' | 'blue' | 'green';
  createdAt: Date;
  updatedAt: Date;
  isCompleted?: boolean; // To-Do 아이템의 완료 상태
}

/**
 * 타입 가드 함수들
 */

/**
 * 카테고리 타입 가드
 * @param value - 검증할 값
 * @returns 유효한 카테고리인지 여부
 */
export function isCategory(value: string): value is 'To-Do' | '메모' | '아이디어' {
  return ['To-Do', '메모', '아이디어'].includes(value);
}

/**
 * 색상 타입 가드
 * @param value - 검증할 값
 * @returns 유효한 색상인지 여부
 */
export function isColor(value: string): value is 'yellow' | 'pink' | 'blue' | 'green' {
  return ['yellow', 'pink', 'blue', 'green'].includes(value);
}

/**
 * StickyNote 타입 가드
 * @param value - 검증할 값
 * @returns 유효한 StickyNote인지 여부
 */
export function isStickyNote(value: unknown): value is StickyNote {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const note = value as Record<string, unknown>;

  return (
    typeof note.id === 'string' &&
    typeof note.content === 'string' &&
    isCategory(note.category as string) &&
    isColor(note.color as string) &&
    (note.createdAt instanceof Date || typeof note.createdAt === 'string') &&
    (note.updatedAt instanceof Date || typeof note.updatedAt === 'string') &&
    (note.isCompleted === undefined || typeof note.isCompleted === 'boolean')
  );
}

// 뷰 모드 타입
export type ViewMode = 'memo' | 'diagram';

// 스와이프 방향 타입
export type SwipeDirection = 'up' | 'left' | 'right' | 'down';

// 카테고리별 포스트잇 그룹
export interface CategoryGroup {
  category: string;
  notes: StickyNote[];
}

// 제스처 이벤트 타입
export interface GestureEvent {
  deltaX: number;
  deltaY: number;
  direction: SwipeDirection;
  distance: number;
}

