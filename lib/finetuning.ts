/**
 * 파인튜닝 데이터 관리
 * 
 * 사용자가 수정한 카테고리 정보를 저장하여
 * AI 분류 정확도를 향상시키는 데 활용합니다.
 */

import { StickyNote } from './types';
import { STORAGE_KEYS } from './constants';

/**
 * 파인튜닝 데이터 타입
 */
export interface FinetuningData {
  originalContent: string;
  aiPredictedCategory: string;
  userCorrectedCategory: string;
  timestamp: string;
}

/**
 * 사용자가 수정한 카테고리 정보를 저장합니다.
 * 
 * @param note - 수정된 메모
 */
export function saveFinetuningData(note: StickyNote): void {
  if (!note.aiPredictedCategory || !note.userCorrectedCategory) {
    return; // AI 예측이나 사용자 수정 정보가 없으면 저장하지 않음
  }

  if (note.aiPredictedCategory === note.userCorrectedCategory) {
    return; // 수정이 없으면 저장하지 않음
  }

  const data: FinetuningData = {
    originalContent: note.content,
    aiPredictedCategory: note.aiPredictedCategory,
    userCorrectedCategory: note.userCorrectedCategory,
    timestamp: new Date().toISOString(),
  };

  // LocalStorage에 저장
  const existingData = loadFinetuningData();
  existingData.push(data);
  
  // 최대 1000개까지만 저장 (메모리 관리)
  const trimmedData = existingData.slice(-1000);
  
  localStorage.setItem(
    STORAGE_KEYS.FINETUNING_DATA || 'finetuning-data',
    JSON.stringify(trimmedData)
  );
}

/**
 * 저장된 파인튜닝 데이터를 불러옵니다.
 * 
 * @returns 파인튜닝 데이터 배열
 */
export function loadFinetuningData(): FinetuningData[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FINETUNING_DATA || 'finetuning-data');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('파인튜닝 데이터 로드 실패:', error);
  }
  return [];
}

/**
 * 파인튜닝 데이터를 초기화합니다.
 */
export function clearFinetuningData(): void {
  localStorage.removeItem(STORAGE_KEYS.FINETUNING_DATA || 'finetuning-data');
}

/**
 * 파인튜닝 데이터를 분석하여 패턴을 추출합니다.
 * 향후 AI 모델 개선에 활용할 수 있습니다.
 * 
 * @returns 분석 결과
 */
export function analyzeFinetuningData(): {
  totalCorrections: number;
  categoryMistakes: Record<string, Record<string, number>>;
  commonPatterns: string[];
} {
  const data = loadFinetuningData();
  
  const categoryMistakes: Record<string, Record<string, number>> = {};
  
  data.forEach(item => {
    if (!categoryMistakes[item.aiPredictedCategory]) {
      categoryMistakes[item.aiPredictedCategory] = {};
    }
    if (!categoryMistakes[item.aiPredictedCategory][item.userCorrectedCategory]) {
      categoryMistakes[item.aiPredictedCategory][item.userCorrectedCategory] = 0;
    }
    categoryMistakes[item.aiPredictedCategory][item.userCorrectedCategory]++;
  });

  return {
    totalCorrections: data.length,
    categoryMistakes,
    commonPatterns: [], // 향후 구현 가능
  };
}
