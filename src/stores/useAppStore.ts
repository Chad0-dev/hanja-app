import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { migrateDataToSQLite } from '../database/dataMigration';
import {
  getGradeStatistics,
  getWordsByGrade,
  initializeDatabase,
} from '../database/hanjaDB';
import { CardHistoryManager, processGoBack } from '../hooks/useCardHistory';
import { MultiGradeService, RelatedWordService } from '../services';
import {
  CardHistoryItem,
  HanjaGrade,
  HanjaWordCard,
  StudyProgress,
} from '../types';

export interface PersistedState {
  studyProgress: StudyProgress[];
  selectedGrade: HanjaGrade;
  selectedGrades: HanjaGrade[];
  studyMode: 'sequential' | 'random';
  isDarkMode: boolean;
  isLeftHanded: boolean;
  isDbInitialized: boolean;
  studiedCardIds: string[];
  savedCardIds: string[];
  favoriteCharacters: string[];
  favoriteWords: string[];
  swipeCount: number;
  isAdsRemoved: boolean;
  bookmarkedIdiomIds: string[];
}

interface AppState {
  cardStack: HanjaWordCard[];
  currentCardIndex: number;
  currentCard: HanjaWordCard | null;
  isLoading: boolean;
  cardHistory: CardHistoryItem[];
  canGoBack: boolean;
  studiedCardIds: string[];
  savedCardIds: string[];
  recentCardIds: string[];
  recentCardWords: string[];
  studyProgress: StudyProgress[];
  selectedGrade: HanjaGrade;
  selectedGrades: HanjaGrade[];
  studyMode: 'sequential' | 'random';
  isDarkMode: boolean;
  isLeftHanded: boolean;
  favoriteCharacters: Set<string>;
  favoriteWords: Set<string>;
  isDbInitialized: boolean;
  reverseAnimationTrigger: ((direction: 'left' | 'right') => void) | null;
  initializeCardStack: () => Promise<void>;
  moveToNextCard: () => void;
  moveToPreviousCard: () => void;
  refillCardStack: () => Promise<void>;
  swipeLeft: () => void;
  swipeRight: () => void;
  handleSwipeToRelatedWord: (
    currentCard: HanjaWordCard,
    swipeDirection: 'left' | 'right'
  ) => Promise<void>;
  goBackToPreviousCard: () => void;
  setReverseAnimationTrigger: (
    callback: (direction: 'left' | 'right') => void
  ) => void;
  customUndoHandler: (() => void) | null;
  isCustomUndoAvailable: boolean;
  setCustomUndoHandler: (handler: (() => void) | null) => void;
  setCustomUndoAvailability: (available: boolean) => void;
  recordAnswer: (characterId: string, isCorrect: boolean) => void;
  toggleFavorite: (characterId: string) => void;
  markAsLearned: (characterId: string) => void;
  toggleFavoriteCharacter: (characterId: string) => void;
  toggleFavoriteWord: (wordId: string) => void;
  isFavoriteCharacter: (characterId: string) => boolean;
  isFavoriteWord: (wordId: string) => boolean;
  getTotalLearned: () => number;
  getFavoriteCount: () => number;
  getAccuracyRate: (characterId?: string) => number;
  initializeApp: () => Promise<void>;
  getWordsFromDb: (grade?: HanjaGrade) => Promise<HanjaWordCard[]>;
  getDbStatistics: () => Promise<
    Record<HanjaGrade, { total: number; memorized: number }>
  >;
  forceReinitializeDatabase: () => Promise<void>;
  setSelectedGrade: (grade: HanjaGrade | undefined) => void;
  setSelectedGrades: (grades: HanjaGrade[]) => void;
  setDarkMode: (isDark: boolean) => void;
  setLeftHanded: (isLeft: boolean) => void;
  loadCards: (grade?: HanjaGrade | null) => Promise<HanjaWordCard[]>;
  removeBookmarkedWordFromStack: (wordId: string) => void;
  cachedWords: Record<HanjaGrade, HanjaWordCard[]>;
  clearCache: () => void;
  swipeCount: number;
  incrementSwipeCount: () => void;
  resetSwipeCount: () => void;
  isAdsRemoved: boolean;
  setAdsRemoved: (isRemoved: boolean) => void;
  bookmarkedIdiomIds: string[];
  toggleIdiomBookmark: (idiomId: string) => void;
}

const createEmptyCache = (): Record<HanjaGrade, HanjaWordCard[]> => ({
  '1급': [],
  '2급': [],
  '3급': [],
  '4급': [],
  '5급': [],
  '6급': [],
  '7급': [],
  '8급': [],
});

export const useAppStore = create<AppState>()(
  persist<AppState>(
    (set, get) => ({
      cardStack: [],
      currentCardIndex: 0,
      currentCard: null,
      isLoading: false,
      cardHistory: [],
      canGoBack: false,
      studiedCardIds: [],
      savedCardIds: [],
      recentCardIds: [],
      recentCardWords: [],
      studyProgress: [],
      selectedGrade: '8급',
      selectedGrades: ['8급'],
      studyMode: 'sequential',
      isDarkMode: false,
      isLeftHanded: false,
      favoriteCharacters: new Set<string>(),
      favoriteWords: new Set<string>(),
      isDbInitialized: false,
      reverseAnimationTrigger: null,
      swipeCount: 0,
      isAdsRemoved: false,
      cachedWords: createEmptyCache(),
      customUndoHandler: null,
      isCustomUndoAvailable: false,
      bookmarkedIdiomIds: [],

      async initializeCardStack() {
        set({ isLoading: true });
        try {
          const { selectedGrades, selectedGrade } = get();
          const multiGradeService = MultiGradeService.getInstance();

          const gradesToLoad =
            selectedGrades.length > 0
              ? selectedGrades
              : selectedGrade
                ? [selectedGrade]
                : ['8급'];

          if (selectedGrades.length === 0 && selectedGrade) {
            set({ selectedGrades: [selectedGrade] });
          } else if (selectedGrades.length === 0) {
            set({ selectedGrades: ['8급'], selectedGrade: '8급' });
          }

          const availableCards =
            await multiGradeService.getRandomWordsFromMultipleGrades(
              gradesToLoad as HanjaGrade[],
              50
            );

          if (availableCards.length === 0) {
            console.warn('⚠️ 사용 가능한 카드가 없습니다');
            set({ cardStack: [], currentCardIndex: 0, currentCard: null });
            return;
          }

          const randomStartIndex = Math.floor(
            Math.random() * availableCards.length
          );
          const firstCard = availableCards[randomStartIndex];
          const reorderedCards = [
            firstCard,
            ...availableCards.filter(card => card.id !== firstCard.id),
          ];

          set({
            cardStack: reorderedCards,
            currentCardIndex: 0,
            currentCard: firstCard,
          });
        } catch (error) {
          console.error('❌ 카드 스택 초기화 실패:', error);
          set({ cardStack: [], currentCardIndex: 0, currentCard: null });
        } finally {
          set({ isLoading: false });
        }
      },

      moveToNextCard() {
        set(state => {
          if (state.cardStack.length === 0) return state;

          const nextIndex =
            (state.currentCardIndex + 1) % state.cardStack.length;
          const nextCard = state.cardStack[nextIndex];

          return {
            currentCardIndex: nextIndex,
            currentCard: nextCard || null,
          };
        });
      },

      moveToPreviousCard() {
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
        });
      },

      async refillCardStack() {
        const { selectedGrade } = get();
        const gradeToLoad = selectedGrade || '8급';
        console.log(`🔄 ${gradeToLoad} 카드 스택 리필 중...`);

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

      swipeLeft() {
        const { currentCard, cardHistory } = get();
        if (currentCard) {
          console.log(`👈 왼쪽 스와이프 - ${currentCard.word} 학습 완료`);

          const limitedHistory = CardHistoryManager.addToHistory(
            cardHistory,
            currentCard,
            'left',
            10
          );

          set(state => ({
            studiedCardIds: [...state.studiedCardIds, currentCard.id],
            cardHistory: limitedHistory,
            canGoBack: limitedHistory.length > 0,
          }));
        }

        get().moveToNextCard();
      },

      swipeRight() {
        const { currentCard, cardHistory } = get();
        if (currentCard) {
          console.log(`👉 오른쪽 스와이프 - ${currentCard.word} 저장`);

          const limitedHistory = CardHistoryManager.addToHistory(
            cardHistory,
            currentCard,
            'right',
            10
          );

          set(state => ({
            savedCardIds: [...state.savedCardIds, currentCard.id],
            cardHistory: limitedHistory,
            canGoBack: limitedHistory.length > 0,
          }));
        }

        get().moveToNextCard();
      },

      async handleSwipeToRelatedWord(currentCard, swipeDirection) {
        try {
          const { isWordBookmarked } = await import('../database/hanjaDB');
          const isCurrentCardBookmarked = await isWordBookmarked(
            currentCard.id
          );

          if (isCurrentCardBookmarked) {
            console.log(
              `📚 북마크된 카드 스와이프됨 - 스택에서 제거: ${currentCard.word}`
            );
            get().removeBookmarkedWordFromStack(currentCard.id);
            return;
          }

          const {
            selectedGrades,
            cardHistory,
            recentCardIds,
            recentCardWords,
          } = get();

          const relatedWord = await RelatedWordService.findRelatedWords(
            currentCard,
            swipeDirection,
            {
              selectedGrades,
              excludeRecentIds: recentCardIds,
              recentWords: recentCardWords,
            }
          );

          const limitedHistory = CardHistoryManager.addToHistory(
            cardHistory,
            currentCard,
            swipeDirection,
            10
          );

          if (swipeDirection === 'left') {
            set(state => ({
              studiedCardIds: [...state.studiedCardIds, currentCard.id],
              cardHistory: limitedHistory,
              canGoBack: limitedHistory.length > 0,
            }));
          } else {
            set(state => ({
              savedCardIds: [...state.savedCardIds, currentCard.id],
              cardHistory: limitedHistory,
              canGoBack: limitedHistory.length > 0,
            }));
          }

          if (relatedWord) {
            const updatedRecentIds = [
              currentCard.id,
              ...recentCardIds.slice(0, 9),
            ];
            const updatedRecentWords = [
              currentCard.word,
              ...recentCardWords.slice(0, 9),
            ];

            set({
              currentCard: relatedWord,
              cardStack: [
                relatedWord,
                ...get().cardStack.slice(get().currentCardIndex + 1),
              ],
              currentCardIndex: 0,
              recentCardIds: updatedRecentIds,
              recentCardWords: updatedRecentWords,
            });
          } else {
            get().moveToNextCard();
          }
        } catch (error) {
          get().moveToNextCard();
        }
      },

      goBackToPreviousCard() {
        const { cardHistory, cardStack, reverseAnimationTrigger } = get();

        const result = processGoBack(cardHistory, cardStack);

        console.log(result.message);

        if (!result.success) {
          return;
        }

        console.log(
          `⬅️ 이전 카드로 돌아가기: ${result.previousCard.word} (${result.swipeDirection} 스와이프로 사라짐)`
        );

        if (reverseAnimationTrigger && result.swipeDirection) {
          reverseAnimationTrigger(result.swipeDirection);
        }

        const updateData: Partial<AppState> = {
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

        set(updateData as AppState);
      },

      setReverseAnimationTrigger(callback) {
        set({ reverseAnimationTrigger: callback });
      },
      setCustomUndoHandler(handler) {
        set({ customUndoHandler: handler });
      },
      setCustomUndoAvailability(available) {
        set({ isCustomUndoAvailable: available });
      },
      toggleIdiomBookmark(idiomId) {
        set(state => {
          const exists = state.bookmarkedIdiomIds.includes(idiomId);
          const bookmarkedIdiomIds = exists
            ? state.bookmarkedIdiomIds.filter(id => id !== idiomId)
            : [...state.bookmarkedIdiomIds, idiomId];
          return { bookmarkedIdiomIds };
        });
      },

      removeBookmarkedWordFromStack(wordId) {
        const { cardStack, currentCardIndex, currentCard } = get();

        const filteredStack = cardStack.filter(card => card.id !== wordId);

        if (filteredStack.length === cardStack.length) {
          return;
        }

        console.log(`📚 북마크된 단어 실시간 제거: ${wordId}`);
        console.log(
          `📊 카드 스택: ${cardStack.length}개 → ${filteredStack.length}개`
        );

        const isCurrentCardRemoved = currentCard?.id === wordId;

        if (isCurrentCardRemoved) {
          if (filteredStack.length === 0) {
            set({
              cardStack: filteredStack,
              currentCardIndex: 0,
              currentCard: null,
            });
            console.log('📭 모든 카드가 제거되었습니다');
          } else {
            const newIndex = Math.min(
              currentCardIndex,
              filteredStack.length - 1
            );
            const newCurrentCard = filteredStack[newIndex];

            set({
              cardStack: filteredStack,
              currentCardIndex: newIndex,
              currentCard: newCurrentCard,
            });
            console.log(
              `🔄 현재 카드 변경: ${newCurrentCard.word} (${newCurrentCard.pronunciation})`
            );
          }
        } else {
          let newIndex = currentCardIndex;

          const removedCardIndex = cardStack.findIndex(
            card => card.id === wordId
          );
          if (removedCardIndex !== -1 && removedCardIndex < currentCardIndex) {
            newIndex = currentCardIndex - 1;
          }

          set({
            cardStack: filteredStack,
            currentCardIndex: newIndex,
          });
        }
      },

      recordAnswer(characterId, isCorrect) {
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
          }

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
        });
      },

      toggleFavorite(characterId) {
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
          }

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
        });
      },

      markAsLearned(characterId) {
        set(state => ({
          studyProgress: state.studyProgress.map(p =>
            p.characterId === characterId
              ? { ...p, isLearned: true, studiedAt: new Date() }
              : p
          ),
        }));
      },

      toggleFavoriteCharacter(characterId) {
        set(state => {
          const newFavorites = new Set(state.favoriteCharacters);

          if (newFavorites.has(characterId)) {
            newFavorites.delete(characterId);
            console.log(`💔 한자 즐겨찾기 해제: ${characterId}`);
          } else {
            newFavorites.add(characterId);
            console.log(`💖 한자 즐겨찾기 추가: ${characterId}`);
          }

          return { favoriteCharacters: newFavorites };
        });
      },

      toggleFavoriteWord(wordId) {
        set(state => {
          const newFavorites = new Set(state.favoriteWords);

          if (newFavorites.has(wordId)) {
            newFavorites.delete(wordId);
          } else {
            newFavorites.add(wordId);
          }

          return { favoriteWords: newFavorites };
        });
      },

      isFavoriteCharacter(characterId) {
        return get().favoriteCharacters.has(characterId);
      },

      isFavoriteWord(wordId) {
        return get().favoriteWords.has(wordId);
      },

      getTotalLearned() {
        const { studyProgress } = get();
        return studyProgress.filter(p => p.isLearned).length;
      },

      getFavoriteCount() {
        const { studyProgress } = get();
        return studyProgress.filter(p => p.isFavorite).length;
      },

      getAccuracyRate(characterId) {
        const { studyProgress } = get();

        if (characterId) {
          const progress = studyProgress.find(
            p => p.characterId === characterId
          );
          if (!progress) return 0;

          const total = progress.correctCount + progress.wrongCount;
          return total > 0 ? (progress.correctCount / total) * 100 : 0;
        }

        const totalCorrect = studyProgress.reduce(
          (sum, p) => sum + p.correctCount,
          0
        );
        const totalAttempts = studyProgress.reduce(
          (sum, p) => sum + p.correctCount + p.wrongCount,
          0
        );
        return totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
      },

      async initializeApp() {
        const { isDbInitialized, selectedGrade } = get();

        try {
          await initializeDatabase();
        } catch (error) {
          console.error('❌ 데이터베이스 연결 실패:', error);
          throw error;
        }

        console.log('🔍 앱 초기화 상태 확인:', {
          isDbInitialized,
          selectedGrade,
        });

        if (isDbInitialized) {
          try {
            const testWords = await getWordsByGrade('8급');
            if (testWords.length > 0) {
              await get().initializeCardStack();
              return;
            }
            console.warn('⚠️ 데이터베이스에 데이터가 없음 - 재초기화 필요');
            set({ isDbInitialized: false });
          } catch (error) {
            console.warn('⚠️ 데이터베이스 검증 실패 - 재초기화 필요:', error);
            set({ isDbInitialized: false });
          }
        }

        set({ isLoading: true });

        try {
          await migrateDataToSQLite();

          const testWords = await getWordsByGrade('8급');

          if (testWords.length === 0) {
            throw new Error('8급 단어가 데이터베이스에 없습니다');
          }

          set({ isDbInitialized: true });
          await get().initializeCardStack();
        } catch (error) {
          console.error('❌ 앱 초기화 실패:', error);
          set({ isDbInitialized: false });
          throw new Error(`SQLite 초기화 실패: ${error}`);
        } finally {
          set({ isLoading: false });
        }
      },

      async getWordsFromDb(grade) {
        return await get().loadCards(grade);
      },

      async getDbStatistics() {
        try {
          return await getGradeStatistics();
        } catch (error) {
          console.error('❌ 데이터베이스 통계 조회 실패:', error);
          throw error;
        }
      },

      async forceReinitializeDatabase() {
        console.log('🔄 데이터베이스 강제 재초기화 시작...');
        set({ isLoading: true, isDbInitialized: false });

        try {
          console.log('📦 데이터베이스 재초기화 중...');
          await initializeDatabase();
          console.log('✅ 데이터베이스 초기화 완료');

          console.log('🔄 시드 데이터 재마이그레이션 시작...');
          await migrateDataToSQLite();
          console.log('✅ 데이터 재마이그레이션 완료');

          console.log('🔍 데이터베이스 재검증 중...');
          const testWords = await getWordsByGrade('8급');

          if (testWords.length === 0) {
            throw new Error('8급 단어가 데이터베이스에 없습니다');
          }

          set({ isDbInitialized: true });
          console.log('🎉 데이터베이스 재초기화 성공!');

          get().clearCache();
          await get().initializeCardStack();
          console.log('✅ 앱 재초기화 완료');
        } catch (error) {
          console.error('❌ 데이터베이스 재초기화 실패:', error);
          set({ isDbInitialized: false });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      async loadCards(grade) {
        const { isDbInitialized } = get();

        if (!isDbInitialized) {
          console.error('❌ 데이터베이스가 초기화되지 않았습니다');
          throw new Error('Database not initialized');
        }

        const resolveGrade = (value?: HanjaGrade | number | null) => {
          if (value === null || value === undefined) {
            return '8급' as HanjaGrade;
          }

          if (typeof value === 'number') {
            if (value >= 1 && value <= 8) {
              return `${value}급` as HanjaGrade;
            }
            return null;
          }

          if (typeof value === 'string') {
            const match = value.match(/^(\d)급$/);
            if (match) {
              const numericGrade = parseInt(match[1], 10);
              if (numericGrade >= 1 && numericGrade <= 8) {
                return `${numericGrade}급` as HanjaGrade;
              }
            }
            return null;
          }

          return null;
        };

        const loadSingleGrade = async (gradeStr: HanjaGrade) => {
          const { cachedWords } = get();

          if (cachedWords[gradeStr] && cachedWords[gradeStr].length > 0) {
            console.log(
              `🚀 ${gradeStr} 캐시된 단어 ${cachedWords[gradeStr].length}개 반환`
            );
            return cachedWords[gradeStr];
          }

          const words = await getWordsByGrade(gradeStr);

          set(state => ({
            cachedWords: {
              ...state.cachedWords,
              [gradeStr]: words,
            },
          }));

          return words;
        };

        try {
          const normalizedGrade = resolveGrade(grade);

          if (normalizedGrade) {
            return await loadSingleGrade(normalizedGrade);
          }

          const allWords: HanjaWordCard[] = [];
          for (let g = 8; g >= 1; g--) {
            const gradeStr = `${g}급` as HanjaGrade;
            const words = await loadSingleGrade(gradeStr);
            allWords.push(...words);
          }
          return allWords;
        } catch (error) {
          console.error('❌ SQLite 데이터 로딩 실패:', error);
          set({ isDbInitialized: false });
          throw error;
        }
      },

      clearCache() {
        console.log('🧹 캐시 초기화');
        set({ cachedWords: createEmptyCache() });
      },

      setSelectedGrade(grade) {
        const validGrade = grade || '8급';
        console.log(`🎯 급수 변경: ${validGrade}`);

        set({ selectedGrade: validGrade });
        get().initializeCardStack();
      },

      setSelectedGrades(grades) {
        console.log(`📚 선택된 급수: ${grades.join(', ')}`);

        const primaryGrade = grades.length > 0 ? grades[0] : undefined;

        set({
          selectedGrades: grades,
          selectedGrade: primaryGrade ?? '8급',
        });
      },

      setDarkMode(isDark) {
        console.log(`🌙 다크 모드 ${isDark ? '활성화' : '비활성화'}`);
        set({ isDarkMode: isDark });
      },

      setLeftHanded(isLeft) {
        console.log(`🤚 왼손잡이 모드 ${isLeft ? '활성화' : '비활성화'}`);
        set({ isLeftHanded: isLeft });
      },

      incrementSwipeCount() {
        set(state => ({ swipeCount: state.swipeCount + 1 }));
      },

      resetSwipeCount() {
        set({ swipeCount: 0 });
      },

      setAdsRemoved(isRemoved) {
        console.log(`🛒 광고 제거 ${isRemoved ? '활성화' : '비활성화'}`);
        set({ isAdsRemoved: isRemoved });
      },
    }),
    {
      name: 'hanja-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state =>
        ({
          studyProgress: state.studyProgress,
          selectedGrade: state.selectedGrade,
          selectedGrades: state.selectedGrades,
          studyMode: state.studyMode,
          isDarkMode: state.isDarkMode,
          isLeftHanded: state.isLeftHanded,
          isDbInitialized: state.isDbInitialized,
          studiedCardIds: state.studiedCardIds,
          savedCardIds: state.savedCardIds,
          favoriteCharacters: Array.from(
            state.favoriteCharacters
          ) as unknown as Set<string>,
          favoriteWords: Array.from(
            state.favoriteWords
          ) as unknown as Set<string>,
          swipeCount: state.swipeCount,
          isAdsRemoved: state.isAdsRemoved,
        }) as AppState,
      onRehydrateStorage: () => state => {
        if (state) {
          if (Array.isArray((state as any).favoriteCharacters)) {
            state.favoriteCharacters = new Set(
              (state as any).favoriteCharacters
            );
          }
          if (Array.isArray((state as any).favoriteWords)) {
            state.favoriteWords = new Set((state as any).favoriteWords);
          }
          state.isDbInitialized = false;
        }
      },
    }
  )
);
