/**
 * 날짜 유틸리티 함수
 * 
 * 날짜 타입의 일관성을 보장하고, 다양한 날짜 형식을 정규화합니다.
 * Date 객체와 ISO 문자열이 혼재되어 있는 문제를 해결합니다.
 */

/**
 * 날짜를 Date 객체로 정규화합니다.
 * 
 * @param date - Date 객체 또는 ISO 문자열
 * @returns 정규화된 Date 객체
 * 
 * @example
 * ```typescript
 * normalizeDate('2025-01-27T10:00:00Z') // Date 객체 반환
 * normalizeDate(new Date()) // Date 객체 그대로 반환
 * ```
 */
export function normalizeDate(date: Date | string): Date {
  if (date instanceof Date) {
    // 유효한 Date 객체인지 확인
    if (isNaN(date.getTime())) {
      throw new Error('Invalid Date object');
    }
    return date;
  }
  
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid date string: ${date}`);
    }
    return parsedDate;
  }
  
  throw new Error(`Invalid date type: ${typeof date}`);
}

/**
 * 날짜 배열을 정규화합니다.
 * 
 * @param dates - Date 객체 또는 ISO 문자열 배열
 * @returns 정규화된 Date 객체 배열
 */
export function normalizeDates(dates: (Date | string)[]): Date[] {
  return dates.map(normalizeDate);
}

/**
 * 날짜가 유효한지 확인합니다.
 * 
 * @param date - 확인할 날짜
 * @returns 유효한 날짜인지 여부
 */
export function isValidDate(date: unknown): date is Date | string {
  if (date instanceof Date) {
    return !isNaN(date.getTime());
  }
  
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }
  
  return false;
}

/**
 * 두 날짜를 비교합니다.
 * 
 * @param date1 - 첫 번째 날짜
 * @param date2 - 두 번째 날짜
 * @returns date1이 date2보다 이후면 양수, 이전이면 음수, 같으면 0
 */
export function compareDates(date1: Date | string, date2: Date | string): number {
  const d1 = normalizeDate(date1);
  const d2 = normalizeDate(date2);
  return d1.getTime() - d2.getTime();
}

/**
 * 날짜를 ISO 문자열로 변환합니다.
 * 
 * @param date - 변환할 날짜
 * @returns ISO 문자열
 */
export function toISOString(date: Date | string): string {
  return normalizeDate(date).toISOString();
}
