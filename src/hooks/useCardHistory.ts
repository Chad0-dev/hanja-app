import { CardHistoryItem } from '../types';

/**
 * 카드 히스토리 관리를 위한 유틸리티 함수들
 */
export class CardHistoryManager {
  /**
   * 카드를 히스토리에 추가
   */
  static addToHistory(
    currentHistory: CardHistoryItem[],
    card: any,
    direction: 'left' | 'right',
    maxHistorySize: number = 10
  ): CardHistoryItem[] {
    const historyItem: CardHistoryItem = {
      card,
      swipeDirection: direction,
    };

    const newHistory = [...currentHistory, historyItem];
    return newHistory.slice(-maxHistorySize); // 최대 크기 유지
  }

  /**
   * 히스토리에서 이전 카드 가져오기
   */
  static getPreviousItem(history: CardHistoryItem[]): CardHistoryItem | null {
    return history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * 히스토리에서 마지막 아이템 제거
   */
  static removeLastItem(history: CardHistoryItem[]): CardHistoryItem[] {
    return history.slice(0, -1);
  }

  /**
   * 카드 스택에서 특정 카드의 인덱스 찾기
   */
  static findCardIndex(cardStack: any[], cardId: string): number {
    return cardStack.findIndex(card => card.id === cardId);
  }

  /**
   * 카드 스택 재구성 (이전 카드를 첫 번째로)
   */
  static reconstructStack(
    previousCard: any,
    currentStack: any[],
    maxSize: number = 10
  ): any[] {
    return [previousCard, ...currentStack.slice(0, maxSize - 1)];
  }
}

/**
 * 뒤로가기 동작의 결과 타입
 */
export interface GoBackResult {
  success: boolean;
  previousCard?: any;
  newCardStack?: any[];
  newCardIndex?: number;
  newHistory: CardHistoryItem[];
  swipeDirection?: 'left' | 'right';
  message: string;
}

/**
 * 뒤로가기 로직을 처리하는 함수
 */
export const processGoBack = (
  cardHistory: CardHistoryItem[],
  cardStack: any[]
): GoBackResult => {
  if (cardHistory.length === 0) {
    return {
      success: false,
      newHistory: cardHistory,
      message: '❌ 뒤로 갈 카드가 없습니다',
    };
  }

  const previousItem = CardHistoryManager.getPreviousItem(cardHistory);
  const newHistory = CardHistoryManager.removeLastItem(cardHistory);

  if (!previousItem) {
    return {
      success: false,
      newHistory: cardHistory,
      message: '❌ 이전 카드를 찾을 수 없습니다',
    };
  }

  const previousCardIndex = CardHistoryManager.findCardIndex(
    cardStack,
    previousItem.card.id
  );

  if (previousCardIndex !== -1) {
    // 케이스 1: 이전 카드가 cardStack에 있는 경우
    return {
      success: true,
      previousCard: previousItem.card,
      newCardIndex: previousCardIndex,
      newHistory,
      swipeDirection: previousItem.swipeDirection,
      message: `📍 카드 스택에서 인덱스 ${previousCardIndex}로 복귀`,
    };
  } else {
    // 케이스 2: 이전 카드가 cardStack에 없는 경우
    const newStack = CardHistoryManager.reconstructStack(
      previousItem.card,
      cardStack
    );
    return {
      success: true,
      previousCard: previousItem.card,
      newCardStack: newStack,
      newCardIndex: 0,
      newHistory,
      swipeDirection: previousItem.swipeDirection,
      message: `🔄 카드 스택 재구성: ${previousItem.card.word}부터 시작`,
    };
  }
};
