# 🎯 Cursor 작업 지시서

## 📋 작업 개요

기존 코드 고도화 작업은 그대로 진행하되, 아래 4가지 추가 개선 사항을 구현합니다.

---

## 🚀 Task 1: AI 로직 개선 및 회의록 모드 추가

### 1-1. 카테고리 구조 변경

#### 현재 상태
```typescript
// lib/types.ts
category: 'To-Do' | '메모' | '아이디어';
```

#### 변경 사항
- **삭제**: '주제(Topic)' 분류 기능 완전 제거
- **추가**: '회의록' 카테고리 신설

```typescript
// lib/types.ts - 수정 필요
export type Category = 'To-Do' | '메모' | '아이디어' | '회의록';

// StickyNote 인터페이스에 회의 정보 추가
export interface StickyNote {
  id: string;
  content: string;
  category: Category;
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple'; // 보라색 추가 (회의록용)
  createdAt: Date;
  updatedAt: Date;
  isCompleted?: boolean;
  
  // 새로 추가: 회의록 관련 필드
  meetingId?: string;           // 회의 그룹 ID
  meetingTitle?: string;        // AI가 생성한 회의 제목
  isMeetingMode?: boolean;      // 회의록 모드에서 작성되었는지
}
```

#### 파일 수정 목록
1. **`lib/types.ts`**
   - Category 타입에 '회의록' 추가
   - StickyNote에 meetingId, meetingTitle, isMeetingMode 필드 추가

2. **`lib/constants.ts`**
   - CATEGORIES 배열에 '회의록' 추가
   - CATEGORY_COLORS에 '회의록': 'purple' 추가
   - COLOR_CLASSES에 purple 스타일 추가

3. **`lib/ai-categorizer.ts`**
   - 회의록 패턴 추가
   - categorizeByKeywords 함수 수정

---

### 1-2. 실시간 AI 태그 표시 및 사용자 수정 기능

#### 구현 요구사항
1. **실시간 AI 태그 표시**
   - 사용자가 메모 작성 중일 때 AI가 예측한 카테고리를 포스트잇 하단에 표시
   - 디바운스(300ms) 후 예측 수행

2. **사용자 수정 가능**
   - 태그를 클릭하면 드롭다운으로 카테고리 변경 가능
   - To-Do / 메모 / 아이디어 / 회의록 선택

3. **파인튜닝 데이터 수집**
   - 사용자가 수정한 데이터를 로컬에 저장
   - 형식: `{ originalContent: string, aiPredicted: Category, userCorrected: Category, timestamp: Date }`

#### 구현 파일

**components/StickyNoteInput.tsx - 수정 필요**

```typescript
// 추가할 상태
const [predictedCategory, setPredictedCategory] = useState<Category>('메모');
const [userSelectedCategory, setUserSelectedCategory] = useState<Category | null>(null);

// AI 예측 (디바운스 적용)
const debouncedContent = useDebounce(content, 300);

useEffect(() => {
  if (debouncedContent.trim()) {
    const predicted = categorizeForPreview(debouncedContent);
    setPredictedCategory(predicted);
  }
}, [debouncedContent]);

// 사용자가 카테고리를 수정했을 때
const handleCategoryChange = (newCategory: Category) => {
  setUserSelectedCategory(newCategory);
  
  // 파인튜닝 데이터 저장
  saveFinetuningData({
    originalContent: content,
    aiPredicted: predictedCategory,
    userCorrected: newCategory,
    timestamp: new Date()
  });
};

// UI에 태그 표시
<div className="absolute bottom-8 left-3 right-3">
  <CategoryTagSelector
    predictedCategory={userSelectedCategory || predictedCategory}
    onSelect={handleCategoryChange}
  />
</div>
```

**새로 만들 컴포넌트: `components/CategoryTagSelector.tsx`**

```typescript
// 카테고리 선택 드롭다운 컴포넌트
interface CategoryTagSelectorProps {
  predictedCategory: Category;
  onSelect: (category: Category) => void;
}

export function CategoryTagSelector({ predictedCategory, onSelect }: CategoryTagSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-gray-300 text-sm">
          <TagIcon className="w-4 h-4" />
          {predictedCategory}
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onSelect('To-Do')}>
          📌 To-Do
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect('메모')}>
          📝 메모
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect('아이디어')}>
          💡 아이디어
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect('회의록')}>
          🎤 회의록
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**새로 만들 파일: `lib/finetuning.ts`**

```typescript
// 파인튜닝 데이터 관리
interface FinetuningData {
  originalContent: string;
  aiPredicted: Category;
  userCorrected: Category;
  timestamp: Date;
}

const FINETUNING_STORAGE_KEY = 'ai-finetuning-data';

export function saveFinetuningData(data: FinetuningData): void {
  const existing = getFinetuningData();
  existing.push(data);
  localStorage.setItem(FINETUNING_STORAGE_KEY, JSON.stringify(existing));
  
  console.log('🎓 파인튜닝 데이터 저장:', data);
}

export function getFinetuningData(): FinetuningData[] {
  const data = localStorage.getItem(FINETUNING_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}
```

---

### 1-3. 회의록 모드 구현

#### 구현 요구사항

1. **회의록 모드 체크박스**
   - 포스트잇 입력 화면 상단에 체크박스 추가
   - 체크 시: "🎤 회의록 모드 ON" 표시
   - 체크 해제 시: 회의 종료 → 새 회의 ID 생성 준비

2. **회의 그룹화**
   - 회의록 모드 ON 중 작성된 모든 메모는 동일한 `meetingId` 할당
   - 회의록 모드 OFF 시 해당 회의 종료
   - 다시 ON 시 새로운 `meetingId` 생성

3. **회의 제목 자동 생성**
   - 회의가 종료되면 해당 회의의 모든 메모 내용을 분석
   - AI로 회의 제목 생성 (예: "2025 Q1 마케팅 전략 회의")
   - 생성된 제목을 모든 관련 메모의 `meetingTitle`에 저장

#### 구현 파일

**app/page.tsx - 수정 필요**

```typescript
// 회의록 모드 상태 추가
const [isMeetingMode, setIsMeetingMode] = useState(false);
const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);

// 회의록 모드 토글
const toggleMeetingMode = async () => {
  if (isMeetingMode) {
    // 회의 종료: 제목 생성
    if (currentMeetingId) {
      await generateMeetingTitle(currentMeetingId);
    }
    setCurrentMeetingId(null);
  } else {
    // 회의 시작: 새 ID 생성
    setCurrentMeetingId(crypto.randomUUID());
  }
  setIsMeetingMode(!isMeetingMode);
};

// 메모 저장 시 회의 정보 추가
const addNote = async (content: string) => {
  // ... 기존 코드
  
  const newNote: StickyNote = {
    // ... 기존 필드
    meetingId: isMeetingMode ? currentMeetingId : undefined,
    isMeetingMode: isMeetingMode,
    category: isMeetingMode ? '회의록' : category,
  };
  
  // ... 저장 로직
};
```

**components/StickyNoteInput.tsx - 수정 필요**

```typescript
// Props에 회의록 모드 추가
interface StickyNoteInputProps {
  // ... 기존 props
  isMeetingMode?: boolean;
  onToggleMeetingMode?: () => void;
}

// UI에 회의록 모드 토글 추가
<div className="fixed top-6 left-6 z-30">
  <label className="flex items-center gap-2 px-4 py-2 bg-white/90 rounded-lg shadow-md cursor-pointer">
    <input
      type="checkbox"
      checked={isMeetingMode}
      onChange={onToggleMeetingMode}
      className="w-4 h-4"
    />
    <span className="text-sm font-medium">
      {isMeetingMode ? '🎤 회의록 모드 ON' : '회의록 모드'}
    </span>
  </label>
</div>
```

**새로 만들 파일: `lib/meeting-title-generator.ts`**

```typescript
// AI로 회의 제목 생성
export async function generateMeetingTitle(
  meetingId: string,
  notes: StickyNote[]
): Promise<string> {
  // 해당 회의의 모든 메모 수집
  const meetingNotes = notes.filter(note => note.meetingId === meetingId);
  
  if (meetingNotes.length === 0) return '제목 없는 회의';
  
  // 모든 메모 내용 합치기
  const allContent = meetingNotes.map(n => n.content).join(' ');
  
  // AI로 제목 생성 (간단한 키워드 추출 방식)
  const keywords = extractKeywords(allContent);
  const date = format(meetingNotes[0].createdAt, 'MM/dd');
  const time = format(meetingNotes[0].createdAt, 'HH:mm');
  
  const title = keywords.length > 0 
    ? `${keywords.slice(0, 3).join(' ')} 회의`
    : `${date} ${time} 회의`;
  
  return title;
}

function extractKeywords(text: string): string[] {
  // 간단한 키워드 추출 (명사 위주)
  const keywords = [
    // 비즈니스 키워드
    '마케팅', '전략', '기획', '개발', '디자인', '프로젝트',
    '예산', '일정', '검토', '승인', '협의', '논의',
    // ... 더 추가
  ];
  
  return keywords.filter(kw => text.includes(kw));
}
```

---

### 1-4. 회의록 카테고리 표시 개선

**components/AffinityDiagram.tsx - 수정 필요**

```typescript
// 회의록 그룹 렌더링
{sortType === 'category' && group === '회의록' && (
  <section key={group} className="mb-16">
    <div className="flex items-center gap-4 mb-8">
      <h2 className="text-3xl font-bold text-purple-600">🎤 회의록</h2>
    </div>
    
    {/* 회의별로 그룹화하여 표시 */}
    {Object.entries(groupByMeeting(groupNotes)).map(([meetingId, meetingNotes]) => (
      <div key={meetingId} className="mb-8">
        <h3 className="text-xl font-semibold mb-4">
          {meetingNotes[0].meetingTitle || '제목 없는 회의'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {format(meetingNotes[0].createdAt, 'yyyy년 MM월 dd일 HH:mm')} 
          {' '}· {meetingNotes.length}개 메모
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {meetingNotes.map(note => (
            // 기존 노트 카드 렌더링
          ))}
        </div>
      </div>
    ))}
  </section>
)}

// 회의별 그룹화 함수
function groupByMeeting(notes: StickyNote[]): Record<string, StickyNote[]> {
  return notes.reduce((acc, note) => {
    const meetingId = note.meetingId || 'no-meeting';
    if (!acc[meetingId]) acc[meetingId] = [];
    acc[meetingId].push(note);
    return acc;
  }, {} as Record<string, StickyNote[]>);
}
```

---

### Task 1 체크리스트

- [ ] `lib/types.ts`: Category에 '회의록' 추가, StickyNote에 회의 필드 추가
- [ ] `lib/constants.ts`: 회의록 카테고리 및 보라색 스타일 추가
- [ ] `lib/ai-categorizer.ts`: 회의록 패턴 추가
- [ ] `components/CategoryTagSelector.tsx`: 새로 생성
- [ ] `lib/finetuning.ts`: 새로 생성
- [ ] `lib/meeting-title-generator.ts`: 새로 생성
- [ ] `components/StickyNoteInput.tsx`: 실시간 태그 표시 및 회의록 모드 토글 추가
- [ ] `app/page.tsx`: 회의록 모드 상태 관리 추가
- [ ] `components/AffinityDiagram.tsx`: 회의록 그룹화 표시
- [ ] **주제(Topic) 관련 코드 완전 삭제**:
  - [ ] `lib/smart-topic-extractor.ts` 파일 삭제 또는 사용 중단
  - [ ] `components/AffinityDiagram.tsx`에서 'topic' 정렬 옵션 제거
  - [ ] 주제 관련 모든 UI 제거

---

## 🎨 Task 2: UI 개선

### 2-1. 레이아웃 Max Width 및 그리드 변경

#### 현재 상태
```typescript
// components/AffinityDiagram.tsx
<div className="max-w-7xl mx-auto px-6 py-8">  // max-w-7xl = 1280px
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
```

#### 변경 사항
- **Max Width**: 1280px (max-w-7xl) → 1920px (커스텀 max-w-\[1920px\])
- **그리드 컬럼**: 최대 6개 → 최대 4개

#### 수정할 파일

**components/AffinityDiagram.tsx**

```typescript
// 기존
<header className="w-full border-b border-gray-200 bg-white">
  <div className="max-w-7xl mx-auto px-6 py-8">

// 변경 후
<header className="w-full border-b border-gray-200 bg-white">
  <div className="max-w-[1920px] mx-auto px-6 py-8">

// 기존
<main className="max-w-7xl mx-auto px-6 py-8">

// 변경 후
<main className="max-w-[1920px] mx-auto px-6 py-8">

// 그리드 변경
// 기존
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">

// 변경 후
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
  // XL, 2XL 브레이크포인트 제거, gap을 4에서 6으로 증가
```

---

### 2-2. 텍스트 말줄임 처리

#### 구현 요구사항
- 포스트잇 내용이 영역을 넘어갈 경우 "..." 표시
- 최대 3-4줄까지만 표시

#### 수정할 파일

**components/AffinityDiagram.tsx**

```typescript
// 메모 텍스트 영역 수정
<div className="flex-1 flex items-center justify-center">
  <p className="text-gray-800 text-center leading-relaxed font-medium text-sm line-clamp-4">
    {/* line-clamp-4 추가: 4줄 이상은 ... 처리 */}
    {note.content}
  </p>
</div>
```

**Tailwind Config 확인** (`tailwind.config.js`)

```javascript
// @tailwindcss/line-clamp 플러그인이 필요하면 추가
module.exports = {
  plugins: [
    // line-clamp은 Tailwind CSS v3.3+에서 기본 제공되므로 별도 플러그인 불필요
  ],
}
```

---

### Task 2 체크리스트

- [ ] `components/AffinityDiagram.tsx`: max-w-7xl → max-w-\[1920px\] (헤더, 메인 모두)
- [ ] `components/AffinityDiagram.tsx`: 그리드 최대 컬럼 6개 → 4개로 변경
- [ ] `components/AffinityDiagram.tsx`: 메모 텍스트에 `line-clamp-4` 클래스 추가
- [ ] 테스트: 1920px 이상 화면에서 4개 컬럼 확인
- [ ] 테스트: 긴 텍스트 말줄임 확인

---

## 📊 Task 3: To-Do 완료율 시각화

### 3-1. 막대 그래프 추가

#### 구현 요구사항
- To-Do 카테고리 헤더에 완료/미완료 현황을 막대 그래프로 표시
- 형식: `[■■■■□□□□□□] 4/10 완료 (40%)`

#### 구현 파일

**새로 만들 컴포넌트: `components/ProgressBar.tsx`**

```typescript
interface ProgressBarProps {
  completed: number;
  total: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ProgressBar({ 
  completed, 
  total, 
  size = 'md',
  showLabel = true 
}: ProgressBarProps) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  return (
    <div className="flex items-center gap-3">
      {/* 막대 그래프 */}
      <div className={`flex-1 bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* 라벨 */}
      {showLabel && (
        <div className="flex items-center gap-2 text-sm font-medium min-w-[120px]">
          <span className="text-green-600">{completed}</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">{total}</span>
          <span className="text-gray-500">({percentage}%)</span>
        </div>
      )}
    </div>
  );
}
```

**components/AffinityDiagram.tsx - 수정 필요**

```typescript
import { ProgressBar } from './ProgressBar';

// To-Do 섹션 헤더 수정
{group === 'To-Do' && (
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center gap-4">
      <h2 className="text-3xl font-bold text-pink-600">To-Do</h2>
    </div>
    
    {/* 기존 배지 대신 막대 그래프 */}
    <div className="flex-1 max-w-md ml-8">
      <ProgressBar 
        completed={completedCount} 
        total={activeCount + completedCount}
        size="md"
      />
    </div>
  </div>
)}
```

---

### Task 3 체크리스트

- [ ] `components/ProgressBar.tsx`: 새로 생성
- [ ] `components/AffinityDiagram.tsx`: To-Do 헤더에 ProgressBar 추가
- [ ] 테스트: 완료/미완료 비율이 정확하게 표시되는지 확인
- [ ] 테스트: 애니메이션 동작 확인

---

## ✨ Task 4: 사용성 개선

### 4-1. 완료된 항목 Hover 시 내용 표시

#### 현재 상태
```typescript
// components/AffinityDiagram.tsx
{note.isCompleted && (
  <div className="absolute inset-0 bg-black/60 rounded-2xl backdrop-blur-sm">
    {/* 항상 블러 처리 */}
  </div>
)}
```

#### 변경 사항
- Hover 시 블러 해제
- 내용이 다시 보이도록 투명도 조절

#### 수정할 파일

**components/AffinityDiagram.tsx**

```typescript
{/* 완료 오버레이 - Hover 시 투명해짐 */}
{note.isCompleted && (
  <div className="absolute inset-0 bg-black/60 rounded-2xl backdrop-blur-sm transition-all duration-300 group-hover:bg-black/20 group-hover:backdrop-blur-none z-10">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center transition-opacity group-hover:opacity-50">
        <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
        <span className="text-white font-bold text-sm">완료됨</span>
      </div>
    </div>
  </div>
)}
```

---

### 4-2. 완료 항목을 미완료로 되돌리기

#### 구현 요구사항
- 더보기 메뉴에 "미완료로 변경" 옵션 추가
- 완료된 항목에서만 표시

#### 수정할 파일

**components/AffinityDiagram.tsx**

```typescript
<DropdownMenuContent align="end" className="w-32">
  {/* 완료되지 않은 항목: 완료 버튼 표시 */}
  {!note.isCompleted && (
    <DropdownMenuItem onClick={(e) => handleComplete(note.id, e)}>
      <Check className="w-4 h-4 mr-2" />
      <span>완료</span>
    </DropdownMenuItem>
  )}
  
  {/* 완료된 항목: 미완료로 되돌리기 버튼 표시 */}
  {note.isCompleted && (
    <DropdownMenuItem onClick={(e) => handleUncomplete(note.id, e)}>
      <RotateCcw className="w-4 h-4 mr-2" />
      <span>미완료</span>
    </DropdownMenuItem>
  )}
  
  {/* 삭제는 항상 표시 */}
  <DropdownMenuItem onClick={(e) => handleDelete(note.id, e)}>
    <Trash2 className="w-4 h-4 mr-2" />
    <span>삭제</span>
  </DropdownMenuItem>
</DropdownMenuContent>

// 미완료 처리 함수 추가
const handleUncomplete = (noteId: string, e?: React.MouseEvent) => {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  
  // 피드백 표시
  setActionFeedback(prev => ({ ...prev, [noteId]: 'uncomplete' }));
  
  // 실제 미완료 처리 (완료 토글)
  setTimeout(() => {
    onNoteComplete(noteId); // 동일한 함수로 토글
    setTimeout(() => {
      setActionFeedback(prev => ({ ...prev, [noteId]: null }));
    }, 500);
  }, 300);
};
```

**추가 아이콘 import**

```typescript
import { RotateCcw } from 'lucide-react';
```

---

### Task 4 체크리스트

- [ ] `components/AffinityDiagram.tsx`: 완료 오버레이에 hover 효과 추가
- [ ] `components/AffinityDiagram.tsx`: handleUncomplete 함수 추가
- [ ] `components/AffinityDiagram.tsx`: 더보기 메뉴에 "미완료" 버튼 추가
- [ ] `lucide-react`에서 RotateCcw 아이콘 import
- [ ] 테스트: Hover 시 블러 해제 확인
- [ ] 테스트: 미완료 버튼 동작 확인

---

## 🗂️ Supabase 데이터베이스 스키마 업데이트

회의록 기능을 위해 데이터베이스 스키마를 업데이트해야 합니다.

### Migration SQL

**SUPABASE_SETUP.md에 추가하거나 별도 실행**

```sql
-- sticky_notes 테이블에 회의록 관련 필드 추가
ALTER TABLE sticky_notes
ADD COLUMN IF NOT EXISTS meeting_id TEXT,
ADD COLUMN IF NOT EXISTS meeting_title TEXT,
ADD COLUMN IF NOT EXISTS is_meeting_mode BOOLEAN DEFAULT FALSE;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_sticky_notes_meeting_id ON sticky_notes(meeting_id);

-- category CHECK 제약 조건 업데이트
ALTER TABLE sticky_notes DROP CONSTRAINT IF EXISTS sticky_notes_category_check;
ALTER TABLE sticky_notes 
ADD CONSTRAINT sticky_notes_category_check 
CHECK (category IN ('To-Do', '메모', '아이디어', '회의록'));

-- color CHECK 제약 조건 업데이트
ALTER TABLE sticky_notes DROP CONSTRAINT IF EXISTS sticky_notes_color_check;
ALTER TABLE sticky_notes 
ADD CONSTRAINT sticky_notes_color_check 
CHECK (color IN ('yellow', 'pink', 'blue', 'green', 'purple'));
```

### 업데이트 체크리스트

- [ ] Supabase Dashboard → SQL Editor 접속
- [ ] 위 SQL 실행
- [ ] `lib/database.types.ts` 타입 업데이트 (필요시)
- [ ] `lib/supabase-api.ts`: 저장/업데이트 함수에 새 필드 추가

---

## 📦 전체 작업 순서 (권장)

### Phase 1: 기반 작업 (1-2시간)
1. ✅ Task 2 (UI 개선) - 가장 간단, 리스크 낮음
2. ✅ Task 4 (사용성 개선) - 기존 코드 약간 수정
3. ✅ Task 3 (완료율 시각화) - 새 컴포넌트 추가

### Phase 2: 핵심 기능 (3-4시간)
4. ✅ Task 1-1 (카테고리 구조 변경)
5. ✅ Task 1-2 (실시간 AI 태그)
6. ✅ Supabase 스키마 업데이트

### Phase 3: 고급 기능 (2-3시간)
7. ✅ Task 1-3 (회의록 모드)
8. ✅ Task 1-4 (회의록 표시)
9. ✅ 통합 테스트 및 버그 수정

---

## 🧪 테스트 체크리스트

### 기능 테스트
- [ ] 회의록 모드 ON/OFF 토글 동작
- [ ] 회의록 모드에서 연속 작성 시 동일 meetingId 할당
- [ ] 회의 종료 시 제목 자동 생성
- [ ] AI 태그 실시간 예측 및 표시
- [ ] 사용자가 태그 수정 시 파인튜닝 데이터 저장
- [ ] 완료 항목 hover 시 내용 표시
- [ ] 미완료로 되돌리기 동작
- [ ] To-Do 완료율 막대 그래프 표시

### UI 테스트
- [ ] 1920px 화면에서 4개 컬럼 확인
- [ ] 긴 텍스트 말줄임 표시
- [ ] 회의록 카테고리 보라색 표시
- [ ] 모바일 반응형 동작

### 데이터 테스트
- [ ] Supabase에 회의 정보 저장 확인
- [ ] LocalStorage에 파인튜닝 데이터 저장 확인
- [ ] 실시간 동기화 정상 작동

---

## 📝 추가 파일 생성 목록

### 새로 생성할 파일
1. `components/CategoryTagSelector.tsx` - 카테고리 선택 드롭다운
2. `components/ProgressBar.tsx` - 완료율 막대 그래프
3. `lib/finetuning.ts` - 파인튜닝 데이터 관리
4. `lib/meeting-title-generator.ts` - 회의 제목 생성

### 수정할 파일
1. `lib/types.ts` - Category 타입, StickyNote 인터페이스
2. `lib/constants.ts` - 회의록 카테고리 추가
3. `lib/ai-categorizer.ts` - 회의록 패턴 추가
4. `components/StickyNoteInput.tsx` - AI 태그 표시, 회의록 모드 토글
5. `app/page.tsx` - 회의록 모드 상태 관리
6. `components/AffinityDiagram.tsx` - UI 개선, 완료율 표시, 회의록 그룹화
7. `lib/supabase-api.ts` - 회의 필드 저장
8. `SUPABASE_SETUP.md` - Migration SQL 추가

### 삭제할 파일/코드
1. `lib/smart-topic-extractor.ts` - 주제 분류 기능 제거
2. `components/AffinityDiagram.tsx`에서 'topic' 관련 코드 제거

---

## 🎯 최종 목표

이 모든 작업이 완료되면:

1. ✅ **AI 정확도 향상**: 사용자 피드백으로 파인튜닝
2. ✅ **회의록 전용 모드**: 회의 중 빠른 메모 작성
3. ✅ **개선된 UI**: 더 큰 화면에서 최적화된 레이아웃
4. ✅ **직관적인 완료율 표시**: 막대 그래프로 시각화
5. ✅ **향상된 사용성**: Hover 효과, 미완료 복원

---

**작성일**: 2025년 12월 16일  
**예상 소요 시간**: 6-9시간  
**난이도**: ⭐⭐⭐⭐ 중상급
