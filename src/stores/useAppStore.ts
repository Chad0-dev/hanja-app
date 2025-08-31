import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
// SQLite 전용 모드 - 시드 데이터만 사용
import { migrateDataToSQLite } from '../database/dataMigration';
import {
  updateWordMemorized as dbUpdateWordMemorized,
  getGradeStatistics,
  getWordsByGrade,
  initializeDatabase,
} from '../database/hanjaDB';
import { CardHistoryManager, processGoBack } from '../hooks/useCardHistory';
import {
  CardHistoryItem,
  HanjaGrade,
  HanjaWordCard,
  StudyProgress,
} from '../types';

interface AppState {
  // 카드 스택 관리
  cardStack: HanjaWordCard[];
  currentCardIndex: number;
  currentCard: HanjaWordCard | null;
  isLoading: boolean;

  // 뒤로가기 기능을 위한 히스토리 관리 (스와이프 방향 포함)
  cardHistory: CardHistoryItem[];
  canGoBack: boolean;

  // 학습 추적 (index.tsx에서 사용)
  studiedCardIds: string[];
  savedCardIds: string[];

  // 학습 진도 관리
  studyProgress: StudyProgress[];

  // 사용자 설정
  selectedGrade: HanjaGrade | null;
  studyMode: 'sequential' | 'random';

  // 데이터베이스 상태
  isDbInitialized: boolean;

  // 역방향 애니메이션 트리거 콜백 (스와이프 방향 포함)
  reverseAnimationTrigger: ((direction: 'left' | 'right') => void) | null;

  // 카드 스택 관리 액션들
  initializeCardStack: () => Promise<void>;
  moveToNextCard: () => void;
  moveToPreviousCard: () => void;
  refillCardStack: () => Promise<void>;

  // 스와이프 액션들
  swipeLeft: () => void;
  swipeRight: () => void;

  // 뒤로가기 액션
  goBackToPreviousCard: () => void;

  // 역방향 애니메이션 트리거 콜백 (스와이프 방향 포함)
  setReverseAnimationTrigger: (
    callback: (direction: 'left' | 'right') => void
  ) => void;

  // 학습 진도 액션들
  recordAnswer: (characterId: string, isCorrect: boolean) => void;
  toggleFavorite: (characterId: string) => void;
  markAsLearned: (characterId: string) => void;

  // 통계 함수들
  getTotalLearned: () => number;
  getFavoriteCount: () => number;
  getAccuracyRate: (characterId?: string) => number;

  // 데이터베이스 관련
  initializeApp: () => Promise<void>;
  getWordsFromDb: (grade?: HanjaGrade) => Promise<HanjaWordCard[]>;
  getDbStatistics: () => Promise<
    Record<HanjaGrade, { total: number; memorized: number }>
  >;
  setSelectedGrade: (grade: HanjaGrade | null) => void;
  toggleWordMemorized: (wordId: string) => Promise<void>;

  // 성능 최적화 헬퍼
  loadCards: (grade?: HanjaGrade | null) => Promise<HanjaWordCard[]>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      cardStack: [],
      currentCardIndex: 0,
      currentCard: null,
      isLoading: false,
      cardHistory: [],
      canGoBack: false,
      studiedCardIds: [],
      savedCardIds: [],
      studyProgress: [],
      selectedGrade: 8, // 기본값을 8급으로 설정
      studyMode: 'sequential',
      isDbInitialized: false,
      reverseAnimationTrigger: null,

      // 카드 스택 관리
      initializeCardStack: async () => {
        set({ isLoading: true });
        try {
          const { selectedGrade } = get();

          // selectedGrade가 null이면 기본값 8급으로 설정
          const gradeToLoad = selectedGrade || 8;
          console.log(`🎯 ${gradeToLoad}급 카드 스택 초기화 중...`);

          // selectedGrade가 null이었다면 8급으로 업데이트
          if (!selectedGrade) {
            set({ selectedGrade: 8 });
          }

          const availableCards = await get().loadCards(gradeToLoad);
          console.log(`📚 ${availableCards.length}개 카드 로드됨`);

          if (availableCards.length === 0) {
            console.warn('⚠️ 사용 가능한 카드가 없습니다');
            set({ cardStack: [], currentCardIndex: 0 });
            return;
          }

          set({
            cardStack: availableCards,
            currentCardIndex: 0,
            currentCard: availableCards[0] || null,
          });

          console.log('✅ 카드 스택 초기화 완료');
        } catch (error) {
          console.error('❌ 카드 스택 초기화 실패:', error);
          set({ cardStack: [], currentCardIndex: 0 });
        } finally {
          set({ isLoading: false });
        }
      },

      moveToNextCard: () =>
        set(state => {
          if (state.cardStack.length === 0) return state;

          const nextIndex =
            (state.currentCardIndex + 1) % state.cardStack.length;
          const nextCard = state.cardStack[nextIndex];

          return {
            currentCardIndex: nextIndex,
            currentCard: nextCard || null,
          };
        }),

      moveToPreviousCard: () =>
        set(state => {
          if (state.cardStack.length === 0) return state;

          const prevIndex =
            state.currentCardIndex === 0
              ? state.cardStack.length - 1
              : state.currentCardIndex - 1;
          const prevCard = state.cardStack[prevIndex];

          return {
            currentCardIndex: prevIndex,
            currentCard: prevCard || null,
          };
        }),

      refillCardStack: async () => {
        const { selectedGrade } = get();
        const gradeToLoad = selectedGrade || 8;
        console.log(`🔄 ${gradeToLoad}급 카드 스택 리필 중...`);

        try {
          const availableCards = await get().loadCards(gradeToLoad);
          console.log(`🔄 ${availableCards.length}개 카드로 리필됨`);

          set({
            cardStack: availableCards,
            currentCardIndex: 0,
            currentCard: availableCards[0] || null,
          });
        } catch (error) {
          console.error('❌ 카드 스택 리필 실패:', error);
        }
      },

      // 스와이프 액션들
      swipeLeft: () => {
        const { currentCard, cardHistory } = get();
        if (currentCard) {
          console.log(`👈 왼쪽 스와이프 - ${currentCard.word} 학습 완료`);

          // 히스토리 매니저를 사용하여 히스토리 관리
          const limitedHistory = CardHistoryManager.addToHistory(
            cardHistory,
            currentCard,
            'left',
            10
          );

          // 학습한 카드 ID 추가
          set(state => ({
            studiedCardIds: [...state.studiedCardIds, currentCard.id],
            cardHistory: limitedHistory,
            canGoBack: limitedHistory.length > 0,
          }));
        }

        get().moveToNextCard();
      },

      swipeRight: () => {
        const { currentCard, cardHistory } = get();
        if (currentCard) {
          console.log(`👉 오른쪽 스와이프 - ${currentCard.word} 저장`);

          // 히스토리 매니저를 사용하여 히스토리 관리
          const limitedHistory = CardHistoryManager.addToHistory(
            cardHistory,
            currentCard,
            'right',
            10
          );

          // 저장한 카드 ID 추가
          set(state => ({
            savedCardIds: [...state.savedCardIds, currentCard.id],
            cardHistory: limitedHistory,
            canGoBack: limitedHistory.length > 0,
          }));
        }

        get().moveToNextCard();
      },

      // 뒤로가기 액션 (개선된 버전)
      goBackToPreviousCard: () => {
        const { cardHistory, cardStack, reverseAnimationTrigger } = get();

        // processGoBack 함수를 사용하여 뒤로가기 로직 처리
        const result = processGoBack(cardHistory, cardStack);

        console.log(result.message);

        if (!result.success) {
          return;
        }

        console.log(
          `⬅️ 이전 카드로 돌아가기: ${result.previousCard.word} (${result.swipeDirection} 스와이프로 사라짐)`
        );

        // 역방향 애니메이션 트리거
        if (reverseAnimationTrigger && result.swipeDirection) {
          reverseAnimationTrigger(result.swipeDirection);
        }

        // 상태 업데이트
        const updateData: any = {
          currentCard: result.previousCard,
          cardHistory: result.newHistory,
          canGoBack: result.newHistory.length > 0,
        };

        if (result.newCardStack) {
          updateData.cardStack = result.newCardStack;
        }

        if (result.newCardIndex !== undefined) {
          updateData.currentCardIndex = result.newCardIndex;
        }

        set(updateData);
      },

      // 역방향 애니메이션 트리거 콜백 설정
      setReverseAnimationTrigger: callback => {
        set({ reverseAnimationTrigger: callback });
      },

      // 학습 진도 관리
      recordAnswer: (characterId, isCorrect) =>
        set(state => {
          const existingProgress = state.studyProgress.find(
            p => p.characterId === characterId
          );

          if (existingProgress) {
            return {
              studyProgress: state.studyProgress.map(p =>
                p.characterId === characterId
                  ? {
                      ...p,
                      correctCount: isCorrect
                        ? p.correctCount + 1
                        : p.correctCount,
                      wrongCount: !isCorrect ? p.wrongCount + 1 : p.wrongCount,
                      studiedAt: new Date(),
                    }
                  : p
              ),
            };
          } else {
            return {
              studyProgress: [
                ...state.studyProgress,
                {
                  characterId,
                  isLearned: false,
                  isFavorite: false,
                  studiedAt: new Date(),
                  correctCount: isCorrect ? 1 : 0,
                  wrongCount: isCorrect ? 0 : 1,
                },
              ],
            };
          }
        }),

      toggleFavorite: characterId =>
        set(state => {
          const progress = state.studyProgress.find(
            p => p.characterId === characterId
          );

          if (progress) {
            return {
              studyProgress: state.studyProgress.map(p =>
                p.characterId === characterId
                  ? { ...p, isFavorite: !p.isFavorite }
                  : p
              ),
            };
          } else {
            return {
              studyProgress: [
                ...state.studyProgress,
                {
                  characterId,
                  isLearned: false,
                  isFavorite: true,
                  studiedAt: new Date(),
                  correctCount: 0,
                  wrongCount: 0,
                },
              ],
            };
          }
        }),

      markAsLearned: characterId =>
        set(state => ({
          studyProgress: state.studyProgress.map(p =>
            p.characterId === characterId
              ? { ...p, isLearned: true, studiedAt: new Date() }
              : p
          ),
        })),

      // 통계 함수들
      getTotalLearned: () => {
        const { studyProgress } = get();
        return studyProgress.filter(p => p.isLearned).length;
      },

      getFavoriteCount: () => {
        const { studyProgress } = get();
        return studyProgress.filter(p => p.isFavorite).length;
      },

      getAccuracyRate: characterId => {
        const { studyProgress } = get();

        if (characterId) {
          const progress = studyProgress.find(
            p => p.characterId === characterId
          );
          if (!progress) return 0;

          const total = progress.correctCount + progress.wrongCount;
          return total > 0 ? (progress.correctCount / total) * 100 : 0;
        } else {
          const totalCorrect = studyProgress.reduce(
            (sum, p) => sum + p.correctCount,
            0
          );
          const totalAttempts = studyProgress.reduce(
            (sum, p) => sum + p.correctCount + p.wrongCount,
            0
          );
          return totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
        }
      },

      // 앱 초기화 (SQLite 전용 모드)
      initializeApp: async () => {
        const { isDbInitialized, selectedGrade } = get();

        console.log('🔍 앱 초기화 상태 확인:', {
          isDbInitialized,
          selectedGrade,
        });

        // 실제 데이터베이스 상태 검증 (상태만으로는 신뢰할 수 없음)
        if (isDbInitialized) {
          try {
            console.log('🔍 실제 데이터베이스 상태 검증 중...');
            const testWords = await getWordsByGrade(8);
            if (testWords.length > 0) {
              console.log('✅ 데이터베이스 검증 성공 - 카드 스택만 초기화');
              await get().initializeCardStack();
              return;
            } else {
              console.warn('⚠️ 데이터베이스에 데이터가 없음 - 재초기화 필요');
              set({ isDbInitialized: false });
            }
          } catch (error) {
            console.warn('⚠️ 데이터베이스 검증 실패 - 재초기화 필요:', error);
            set({ isDbInitialized: false });
          }
        }

        set({ isLoading: true });

        try {
          console.log('🚀 앱 초기화 시작 (SQLite 전용 모드)...');

          // SQLite 강제 초기화
          console.log('📦 데이터베이스 강제 초기화 중...');
          await initializeDatabase();
          console.log('✅ 데이터베이스 초기화 완료');

          console.log('🔄 시드 데이터 마이그레이션 시작...');
          await migrateDataToSQLite();
          console.log('✅ 데이터 마이그레이션 완료');

          // 데이터베이스 검증
          console.log('🔍 데이터베이스 검증 중...');
          const testWords = await getWordsByGrade(8);
          console.log(`📊 8급 단어 ${testWords.length}개 확인`);

          if (testWords.length === 0) {
            throw new Error('8급 단어가 데이터베이스에 없습니다');
          }

          set({ isDbInitialized: true });
          console.log('🎉 SQLite 모드로 초기화 성공!');

          // 카드 스택 초기화
          await get().initializeCardStack();
          console.log('✅ 앱 초기화 완료');
        } catch (error) {
          console.error('❌ 앱 초기화 실패:', error);
          set({ isDbInitialized: false });

          // SQLite 실패시 앱 사용 불가
          throw new Error(`SQLite 초기화 실패: ${error}`);
        } finally {
          set({ isLoading: false });
        }
      },

      // 급수 설정
      setSelectedGrade: (grade: HanjaGrade | null) => {
        const validGrade = grade || 8; // null이면 8급으로 설정
        console.log(`🎯 급수 변경: ${validGrade}급`);

        set({ selectedGrade: validGrade });
        // 급수 변경시 카드 스택 재초기화
        get().initializeCardStack();
      },

      // 암기 상태 토글
      toggleWordMemorized: async (wordId: string) => {
        const { isDbInitialized } = get();

        if (!isDbInitialized) {
          console.error('❌ 데이터베이스가 초기화되지 않았습니다');
          return;
        }

        try {
          // 현재 상태 확인 후 토글 (단순화된 구현)
          await dbUpdateWordMemorized(wordId, true); // 실제로는 현재 상태를 확인해야 함
          console.log(`✅ 단어 ${wordId} 암기 상태 업데이트됨`);

          // 카드 스택 새로고침
          await get().refillCardStack();
        } catch (error) {
          console.error('❌ 암기 상태 업데이트 실패:', error);
        }
      },

      // SQLite 전용 로드 함수
      loadCards: async (
        grade?: HanjaGrade | null
      ): Promise<HanjaWordCard[]> => {
        const { isDbInitialized } = get();

        if (!isDbInitialized) {
          console.error('❌ 데이터베이스가 초기화되지 않았습니다');
          throw new Error('Database not initialized');
        }

        try {
          // grade가 null이거나 undefined면 8급을 기본값으로 사용
          const gradeToLoad = grade ?? 8;

          if (
            typeof gradeToLoad === 'number' &&
            gradeToLoad >= 1 &&
            gradeToLoad <= 8
          ) {
            console.log(`📖 ${gradeToLoad}급 단어 로딩 중...`);
            return await getWordsByGrade(gradeToLoad as HanjaGrade);
          } else {
            // 전체 급수 로딩 (grade가 유효하지 않은 경우)
            console.log('📖 전체 급수 단어 로딩 중...');
            const allWords: HanjaWordCard[] = [];
            for (let g = 8; g >= 1; g--) {
              const words = await getWordsByGrade(g as HanjaGrade);
              allWords.push(...words);
            }
            return allWords;
          }
        } catch (error) {
          console.error('❌ SQLite 데이터 로딩 실패:', error);
          set({ isDbInitialized: false });
          throw error;
        }
      },

      // 데이터베이스 유틸리티 함수들
      getWordsFromDb: async (grade?: HanjaGrade): Promise<HanjaWordCard[]> => {
        return await get().loadCards(grade);
      },

      getDbStatistics: async (): Promise<
        Record<HanjaGrade, { total: number; memorized: number }>
      > => {
        try {
          return await getGradeStatistics();
        } catch (error) {
          console.error('❌ 데이터베이스 통계 조회 실패:', error);
          throw error;
        }
      },
    }),
    {
      name: 'hanja-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        studyProgress: state.studyProgress,
        selectedGrade: state.selectedGrade,
        studyMode: state.studyMode,
        isDbInitialized: state.isDbInitialized,
        studiedCardIds: state.studiedCardIds,
        savedCardIds: state.savedCardIds,
      }),
    }
  )
);
