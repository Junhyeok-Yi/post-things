# ⚡ 빠른 시작: 프로젝트 개선 사항 적용

## 🎯 5분 안에 적용하기

### 1단계: 환경 변수 확인
```bash
# .env.local 파일이 있는지 확인
cat .env.local

# 없으면 생성
echo "NEXT_PUBLIC_SUPABASE_URL=your-url-here" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here" >> .env.local
```

### 2단계: app/layout.tsx 수정
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { validateEnv } from '@/lib/env';
import { ClientToaster } from '@/components/ClientToaster';
import './globals.css';

// 환경 변수 검증
if (typeof window === 'undefined') {
  try {
    validateEnv();
  } catch (error) {
    console.error(error);
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <ErrorBoundary>
          {children}
          <ClientToaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### 3단계: app/page.tsx에 오프라인 배너 추가
```typescript
import { OfflineBanner } from '@/components/OfflineBanner';

export default function Home() {
  // ... 기존 코드

  return (
    <>
      <OfflineBanner />
      <main className="min-h-screen">
        {/* 기존 내용 */}
      </main>
    </>
  );
}
```

### 4단계: 스켈레톤 UI 적용
```typescript
import { StickyNoteInputSkeleton, AffinityDiagramSkeleton } from '@/components/StickyNoteSkeleton';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return viewMode === 'memo' 
      ? <StickyNoteInputSkeleton /> 
      : <AffinityDiagramSkeleton />;
  }

  // ... 기존 렌더링
}
```

### 5단계: 개발 서버 재시작
```bash
npm run dev
```

## ✅ 완료!

이제 다음 기능들이 작동합니다:
- ✅ 에러 발생 시 앱이 크래시되지 않음 (에러 바운더리)
- ✅ 오프라인 상태 알림
- ✅ 로딩 중 스켈레톤 UI 표시
- ✅ 환경 변수 자동 검증

## 📚 더 자세한 내용

- **IMPROVEMENTS.md**: 전체 개선 사항 적용 가이드
- **PROJECT_ANALYSIS.md**: 상세한 프로젝트 분석 및 개선 방안 (7가지 영역, 60+ 페이지)

## 🐛 문제 발생 시

### 환경 변수 오류
```
❌ Missing required environment variables
```
→ `.env.local` 파일에 Supabase URL과 ANON_KEY 추가

### TypeScript 에러
```
Cannot find module '@/lib/constants'
```
→ 개발 서버 재시작: `npm run dev`

### import 에러
```
Module not found: Can't resolve '@/components/ErrorBoundary'
```
→ 파일이 올바른 위치에 있는지 확인

## 🚀 다음 단계

1. **입력 검증 적용**: components/StickyNoteInput.tsx에서 `validateNoteContent` 사용
2. **디바운스 추가**: 실시간 색상 미리보기에 `useDebounce` 적용
3. **에러 처리 개선**: 모든 try-catch에 구체적인 에러 타입 처리
4. **상수 교체**: 하드코딩된 값들을 `lib/constants.ts`의 상수로 교체

---

**작성일**: 2025년 12월 16일  
**소요 시간**: 5분  
**난이도**: ⭐ 쉬움
