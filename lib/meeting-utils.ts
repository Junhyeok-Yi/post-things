/**
 * 회의록 관련 유틸리티
 * 
 * 회의록 모드에서 작성된 메모들을 관리하고,
 * 회의 제목을 추출하는 기능을 제공합니다.
 */

import { StickyNote, Meeting } from './types';
import { normalizeDate } from './date-utils';

/**
 * 회의 제목을 추출합니다.
 * 메모 내용들을 분석하여 회의의 주제를 파악합니다.
 * 
 * @param notes - 회의 중 작성된 메모들
 * @returns 추출된 회의 제목
 */
export function extractMeetingTitle(notes: StickyNote[]): string {
  if (notes.length === 0) {
    return '회의록';
  }

  if (notes.length === 1) {
    // 메모가 하나면 그 내용을 제목으로 사용 (최대 20자)
    const content = notes[0].content.trim();
    return content.length > 20 ? content.substring(0, 20) + '...' : content;
  }

  // 여러 메모가 있을 경우 공통 키워드 추출
  const keywords = extractCommonKeywords(notes);
  
  if (keywords.length > 0) {
    // 가장 빈번한 키워드들을 조합하여 제목 생성
    const title = keywords.slice(0, 3).join(' / ');
    return title.length > 30 ? title.substring(0, 30) + '...' : title;
  }

  // 키워드가 없으면 첫 번째 메모의 앞부분 사용
  const firstContent = notes[0].content.trim();
  return firstContent.length > 20 ? firstContent.substring(0, 20) + '...' : firstContent;
}

/**
 * 메모들에서 공통 키워드를 추출합니다.
 * 
 * @param notes - 분석할 메모들
 * @returns 공통 키워드 배열 (빈도순)
 */
function extractCommonKeywords(notes: StickyNote[]): string[] {
  // 2글자 이상의 단어들 추출
  const wordFrequency: Record<string, number> = {};
  
  notes.forEach(note => {
    const words = note.content
      .split(/[\s,\.!?]+/)
      .filter(word => word.length >= 2)
      .filter(word => !/^[가-힣]{1}$/.test(word)) // 조사 제외
      .filter(word => !['그것', '이것', '저것', '하기', '되는', '있는', '없는', '그리고', '그런데', '하지만'].includes(word));
    
    words.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
  });

  // 빈도가 2 이상인 키워드만 선택
  const commonKeywords = Object.entries(wordFrequency)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);

  return commonKeywords;
}

/**
 * 회의록 그룹을 생성합니다.
 * 같은 meetingId를 가진 메모들을 그룹화합니다.
 * 
 * @param notes - 모든 메모
 * @returns 회의록 그룹 배열
 */
export function groupMeetings(notes: StickyNote[]): Meeting[] {
  // 회의록 카테고리이거나 meetingId가 있는 메모들만 필터링
  const meetingNotes = notes.filter(note => 
    note.category === '회의록' || note.meetingId
  );

  // meetingId별로 그룹화
  const meetingMap = new Map<string, StickyNote[]>();
  
  meetingNotes.forEach(note => {
    const meetingId = note.meetingId || 'unknown';
    if (!meetingMap.has(meetingId)) {
      meetingMap.set(meetingId, []);
    }
    meetingMap.get(meetingId)!.push(note);
  });

  // Meeting 객체로 변환
  const meetings: Meeting[] = [];
  
  meetingMap.forEach((notes, meetingId) => {
    // 날짜 정렬
    const sortedNotes = [...notes].sort((a, b) => {
      const dateA = normalizeDate(a.createdAt);
      const dateB = normalizeDate(b.createdAt);
      return dateA.getTime() - dateB.getTime();
    });

    const startTime = normalizeDate(sortedNotes[0].createdAt);
    const endTime = sortedNotes.length > 1 
      ? normalizeDate(sortedNotes[sortedNotes.length - 1].createdAt)
      : undefined;

    meetings.push({
      id: meetingId,
      title: extractMeetingTitle(sortedNotes),
      startTime,
      endTime,
      noteIds: sortedNotes.map(note => note.id),
    });
  });

  // 시작 시간 역순으로 정렬 (최신 회의가 먼저)
  return meetings.sort((a, b) => {
    return b.startTime.getTime() - a.startTime.getTime();
  });
}

/**
 * 회의록 모드에서 작성된 메모인지 확인합니다.
 * 
 * @param note - 확인할 메모
 * @returns 회의록 모드에서 작성된 메모인지 여부
 */
export function isMeetingNote(note: StickyNote): boolean {
  return note.category === '회의록' || !!note.meetingId;
}
