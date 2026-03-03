// 포스트잇 관련 타입 정의
export interface StickyNote {
  id: string;
  content: string;
  category: 'To-Do' | '메모' | '아이디어';
  color: 'yellow' | 'pink' | 'blue' | 'green';
  createdAt: Date;
  updatedAt: Date;
  isCompleted?: boolean; // To-Do 아이템의 완료 상태
  meetingSessionId?: string | null; // 회의 모드에서 생성된 메모의 세션 ID
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

