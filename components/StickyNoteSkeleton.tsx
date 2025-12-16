/**
 * 스켈레톤 UI 컴포넌트
 * 
 * 데이터 로딩 중에 표시되는 placeholder UI입니다.
 * 사용자에게 콘텐츠가 로딩 중임을 시각적으로 알려주고
 * 레이아웃 시프트(CLS)를 방지합니다.
 */

'use client';

/**
 * 단일 포스트잇 스켈레톤
 */
export function StickyNoteSkeleton() {
  return (
    <div className="aspect-square bg-gray-200 rounded-2xl animate-pulse overflow-hidden relative">
      {/* 접착 테이프 효과 */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-3 bg-gray-300 rounded-b-lg"></div>
      
      {/* 내용 영역 */}
      <div className="p-6 pt-8 h-full flex flex-col justify-between">
        {/* 텍스트 라인들 */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6 mx-auto"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3 mx-auto"></div>
        </div>
        
        {/* 하단 메타데이터 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-300">
          <div className="h-3 bg-gray-300 rounded w-16"></div>
          <div className="h-3 bg-gray-300 rounded w-12"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * 그리드 레이아웃 스켈레톤 (어피니티 다이어그램용)
 */
export function StickyNoteGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StickyNoteSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 섹션 헤더 스켈레톤
 */
export function SectionHeaderSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-8 bg-gray-300 rounded w-32"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * 어피니티 다이어그램 전체 스켈레톤
 */
export function AffinityDiagramSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 스켈레톤 */}
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8 animate-pulse">
            <div>
              <div className="h-10 bg-gray-300 rounded w-48 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-64"></div>
            </div>
            <div>
              <div className="h-8 bg-gray-300 rounded-full w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-20 mt-1"></div>
            </div>
          </div>
          
          {/* 네비게이션 바 스켈레톤 */}
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1 animate-pulse">
            <div className="h-10 bg-gray-300 rounded-md flex-1"></div>
            <div className="h-10 bg-gray-300 rounded-md flex-1"></div>
            <div className="h-10 bg-gray-300 rounded-md flex-1"></div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 스켈레톤 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 섹션 1 */}
        <section className="mb-16">
          <SectionHeaderSkeleton />
          <StickyNoteGridSkeleton count={6} />
        </section>
        
        {/* 섹션 2 */}
        <section className="mb-16">
          <SectionHeaderSkeleton />
          <StickyNoteGridSkeleton count={4} />
        </section>
      </main>
    </div>
  );
}

/**
 * 단일 포스트잇 입력 스켈레톤
 */
export function StickyNoteInputSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gray-50">
      <div className="relative w-full max-w-sm aspect-square bg-gray-200 rounded-lg shadow-lg animate-pulse" style={{ margin: '0 20px' }}>
        {/* 접착 테이프 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-gray-300 rounded-b-sm opacity-60"></div>
        
        {/* 내용 영역 */}
        <div className="p-8 pt-12 space-y-4">
          <div className="h-5 bg-gray-300 rounded w-full"></div>
          <div className="h-5 bg-gray-300 rounded w-5/6"></div>
          <div className="h-5 bg-gray-300 rounded w-4/6"></div>
        </div>
        
        {/* 하단 정보 */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between">
          <div className="h-3 bg-gray-300 rounded w-24"></div>
          <div className="h-3 bg-gray-300 rounded w-12"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * 리스트 아이템 스켈레톤 (향후 검색 결과 등에 사용)
 */
export function ListItemSkeleton() {
  return (
    <div className="p-4 border-b border-gray-200 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-300 rounded-lg flex-shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * 통계 카드 스켈레톤 (향후 대시보드에 사용)
 */
export function StatsCardSkeleton() {
  return (
    <div className="bg-gray-100 p-6 rounded-lg animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-24 mb-3"></div>
      <div className="h-8 bg-gray-300 rounded w-16"></div>
    </div>
  );
}
