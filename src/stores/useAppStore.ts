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
import { MultiGradeService, RelatedWordService } from '../services';
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

  // 연관단어 중복 방지 (최근 출현 단어 추적)
  recentCardIds: string[]; // 최근 10개 카드 ID 추적
  recentCardWords: string[]; // 최근 10개 카드 단어명 추적

  // 학습 진도 관리
  studyProgress: StudyProgress[];

  // 사용자 설정
  selectedGrade: HanjaGrade; // 하위 호환성을 위해 유지
  selectedGrades: HanjaGrade[]; // 새로운 다중 급수 선택
  studyMode: 'sequential' | 'random';
  isDarkMode: boolean;
  isLeftHanded: boolean;

  // 즐겨찾기 시스템
  favoriteCharacters: Set<string>; // 즐겨찾기 한자 ID들
  favoriteWords: Set<string>; // 즐겨찾기 단어 ID들

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

  // 연관단어 스와이프 액션들 (새로운 기능)
  handleSwipeToRelatedWord: (
    currentCard: HanjaWordCard,
    swipeDirection: 'left' | 'right'
  ) => Promise<void>;

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

  // 즐겨찾기 액션들
  toggleFavoriteCharacter: (characterId: string) => void;
  toggleFavoriteWord: (wordId: string) => void;
  isFavoriteCharacter: (characterId: string) => boolean;
  isFavoriteWord: (wordId: string) => boolean;

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
  setSelectedGrade: (grade: HanjaGrade | undefined) => void; // 하위 호환성을 위해 유지
  setSelectedGrades: (grades: HanjaGrade[]) => void; // 새로운 다중 급수 설정
  toggleWordMemorized: (wordId: string) => Promise<void>;
  forceReinitializeDatabase: () => Promise<void>;

  // 설정 관련 액션들
  setDarkMode: (isDark: boolean) => void;
  setLeftHanded: (isLeft: boolean) => void;

  // 성능 최적화 헬퍼
  loadCards: (grade?: HanjaGrade | null) => Promise<HanjaWordCard[]>;

  // 캐시된 데이터 관리
  cachedWords: Record<HanjaGrade, HanjaWordCard[]>;
  clearCache: () => void;
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
      recentCardIds: [],
      recentCardWords: [],
      studyProgress: [],
      selectedGrade: '8급', // 기본값을 8급으로 설정 (하위 호환성)
      selectedGrades: ['8급'], // 기본값을 8급으로 설정 (새로운 다중 급수)
      studyMode: 'sequential',
      isDarkMode: false,
      isLeftHanded: false,
      favoriteCharacters: new Set<string>(),
      favoriteWords: new Set<string>(),
      isDbInitialized: false,
      reverseAnimationTrigger: null,

      // 캐시 초기화
      cachedWords: {
        '1급': [],
        '2급': [],
        '3급': [],
        '4급': [],
        '5급': [],
        '6급': [],
        '7급': [],
        '8급': [],
      },

      // 카드 스택 관리 (다중 급수 지원)
      initializeCardStack: async () => {
        set({ isLoading: true });
        try {
          const { selectedGrades, selectedGrade } = get();
          const multiGradeService = MultiGradeService.getInstance();

          // 다중 급수가 설정되어 있으면 사용, 아니면 기존 단일 급수 사용
          const gradesToLoad =
            selectedGrades.length > 0
              ? selectedGrades
              : selectedGrade
                ? [selectedGrade]
                : ['8급'];

          // 하위 호환성: selectedGrades가 비어있으면 selectedGrade 기반으로 설정
          if (selectedGrades.length === 0 && selectedGrade) {
            set({ selectedGrades: [selectedGrade] });
          } else if (selectedGrades.length === 0) {
            // 둘 다 비어있으면 기본값 8급으로 설정
            set({ selectedGrades: ['8급'], selectedGrade: '8급' });
          }

          // 다중 급수에서 랜덤 단어들을 가져와서 카드 스택 생성
          const availableCards =
            await multiGradeService.getRandomWordsFromMultipleGrades(
              gradesToLoad as HanjaGrade[],
              50 // 초기 카드 스택 크기
            );

          if (availableCards.length === 0) {
            console.warn('⚠️ 사용 가능한 카드가 없습니다');
            set({ cardStack: [], currentCardIndex: 0, currentCard: null });
            return;
          }

          // 첫 번째 카드를 랜덤으로 선택
          const randomStartIndex = Math.floor(
            Math.random() * availableCards.length
          );
          const firstCard = availableCards[randomStartIndex];

          // 선택된 카드를 맨 앞으로 이동
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

      // 연관단어 스와이프 처리 (새로운 핵심 기능)
      handleSwipeToRelatedWord: async (
        currentCard: HanjaWordCard,
        swipeDirection: 'left' | 'right'
      ) => {
        try {
          const {
            selectedGrades,
            cardHistory,
            recentCardIds,
            recentCardWords,
          } = get();

          // 1. 연관단어 검색 (최근 출현 단어들 제외)
          const relatedWord = await RelatedWordService.findRelatedWords(
            currentCard,
            swipeDirection,
            {
              selectedGrades,
              excludeRecentIds: recentCardIds,
              recentWords: recentCardWords,
            }
          );

          // 2. 히스토리에 현재 카드 추가
          const limitedHistory = CardHistoryManager.addToHistory(
            cardHistory,
            currentCard,
            swipeDirection,
            10
          );

          // 3. 스와이프 방향에 따른 학습 상태 업데이트
          if (swipeDirection === 'left') {
            // 왼쪽 스와이프: 학습 완료
            set(state => ({
              studiedCardIds: [...state.studiedCardIds, currentCard.id],
              cardHistory: limitedHistory,
              canGoBack: limitedHistory.length > 0,
            }));
          } else {
            // 오른쪽 스와이프: 저장
            set(state => ({
              savedCardIds: [...state.savedCardIds, currentCard.id],
              cardHistory: limitedHistory,
              canGoBack: limitedHistory.length > 0,
            }));
          }

          // 4. 연관단어가 있으면 다음 카드로 설정, 없으면 기존 로직 사용
          if (relatedWord) {
            // recentCardIds와 recentCardWords 업데이트 (최대 10개 유지)
            const updatedRecentIds = [
              currentCard.id,
              ...recentCardIds.slice(0, 9),
            ];
            const updatedRecentWords = [
              currentCard.word,
              ...recentCardWords.slice(0, 9),
            ];

            // 연관단어를 다음 카드로 설정
            set({
              currentCard: relatedWord,
              // cardStack 맨 앞에 연관단어 삽입
              cardStack: [
                relatedWord,
                ...get().cardStack.slice(get().currentCardIndex + 1),
              ],
              currentCardIndex: 0,
              recentCardIds: updatedRecentIds,
              recentCardWords: updatedRecentWords,
            });
          } else {
            // 연관단어가 없으면 기존 방식으로 다음 카드 이동
            get().moveToNextCard();
          }
        } catch (error) {
          // 오류 발생 시 기존 방식으로 폴백
          get().moveToNextCard();
        }
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
            const testWords = await getWordsByGrade('8급');
            if (testWords.length > 0) {
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
          // SQLite 강제 초기화
          await initializeDatabase();

          await migrateDataToSQLite();

          // 데이터베이스 검증
          const testWords = await getWordsByGrade('8급');

          if (testWords.length === 0) {
            throw new Error('8급 단어가 데이터베이스에 없습니다');
          }

          set({ isDbInitialized: true });

          // 카드 스택 초기화
          await get().initializeCardStack();
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
      setSelectedGrade: (grade: HanjaGrade | undefined) => {
        const validGrade = grade || '8급'; // null이면 8급으로 설정
        console.log(`🎯 급수 변경: ${validGrade}`);

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
            const targetGrade = `${gradeToLoad}급` as HanjaGrade;
            const { cachedWords } = get();

            // 캐시된 데이터가 있으면 반환 (성능 최적화)
            if (
              cachedWords[targetGrade] &&
              cachedWords[targetGrade].length > 0
            ) {
              console.log(
                `🚀 ${targetGrade}급 캐시된 단어 ${cachedWords[targetGrade].length}개 반환`
              );
              return cachedWords[targetGrade];
            }

            const words = await getWordsByGrade(targetGrade);

            // 캐시에 저장
            set(state => ({
              cachedWords: {
                ...state.cachedWords,
                [targetGrade]: words,
              },
            }));

            return words;
          } else {
            // 전체 급수 로딩 (grade가 유효하지 않은 경우)
            const allWords: HanjaWordCard[] = [];
            for (let g = 8; g >= 1; g--) {
              const words = await get().loadCards(`${g}급` as HanjaGrade);
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

      // 데이터베이스 강제 재초기화 (디버깅용)
      forceReinitializeDatabase: async () => {
        console.log('🔄 데이터베이스 강제 재초기화 시작...');
        set({ isLoading: true, isDbInitialized: false });

        try {
          // 데이터베이스 재초기화
          console.log('📦 데이터베이스 재초기화 중...');
          await initializeDatabase();
          console.log('✅ 데이터베이스 초기화 완료');

          console.log('🔄 시드 데이터 재마이그레이션 시작...');
          await migrateDataToSQLite();
          console.log('✅ 데이터 재마이그레이션 완료');

          // 데이터베이스 검증
          console.log('🔍 데이터베이스 재검증 중...');
          const testWords = await getWordsByGrade('8급');

          if (testWords.length === 0) {
            throw new Error('8급 단어가 데이터베이스에 없습니다');
          }

          set({ isDbInitialized: true });
          console.log('🎉 데이터베이스 재초기화 성공!');

          // 캐시 초기화 후 카드 스택 재초기화
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

      // 캐시 초기화 함수 (성능 최적화)
      clearCache: () => {
        console.log('🧹 캐시 초기화');
        set({
          cachedWords: {
            '1급': [],
            '2급': [],
            '3급': [],
            '4급': [],
            '5급': [],
            '6급': [],
            '7급': [],
            '8급': [],
          },
        });
      },

      // 설정 관련 액션들
      setDarkMode: (isDark: boolean) => {
        console.log(`🌙 다크 모드 ${isDark ? '활성화' : '비활성화'}`);
        set({ isDarkMode: isDark });
      },

      setLeftHanded: (isLeft: boolean) => {
        console.log(`🤚 왼손잡이 모드 ${isLeft ? '활성화' : '비활성화'}`);
        set({ isLeftHanded: isLeft });
      },

      // 즐겨찾기 액션들
      toggleFavoriteCharacter: (characterId: string) => {
        const { favoriteCharacters } = get();
        const newFavorites = new Set(favoriteCharacters);

        if (newFavorites.has(characterId)) {
          newFavorites.delete(characterId);
          console.log(`💔 한자 즐겨찾기 해제: ${characterId}`);
        } else {
          newFavorites.add(characterId);
          console.log(`💖 한자 즐겨찾기 추가: ${characterId}`);
        }

        set({ favoriteCharacters: newFavorites });
      },

      toggleFavoriteWord: (wordId: string) => {
        const { favoriteWords } = get();
        const newFavorites = new Set(favoriteWords);

        if (newFavorites.has(wordId)) {
          newFavorites.delete(wordId);
        } else {
          newFavorites.add(wordId);
        }

        set({ favoriteWords: newFavorites });
      },

      isFavoriteCharacter: (characterId: string) => {
        const { favoriteCharacters } = get();
        return favoriteCharacters.has(characterId);
      },

      isFavoriteWord: (wordId: string) => {
        const { favoriteWords } = get();
        return favoriteWords.has(wordId);
      },

      // 다중 급수 설정
      setSelectedGrades: (grades: HanjaGrade[]) => {
        console.log(`📚 선택된 급수: ${grades.join(', ')}`);

        // 하위 호환성을 위해 selectedGrade도 업데이트 (첫 번째 급수 또는 null)
        const primaryGrade = grades.length > 0 ? grades[0] : undefined;

        set({
          selectedGrades: grades,
          selectedGrade: primaryGrade,
        });
      },
    }),
    {
      name: 'hanja-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        studyProgress: state.studyProgress,
        selectedGrade: state.selectedGrade,
        selectedGrades: state.selectedGrades,
        studyMode: state.studyMode,
        isDarkMode: state.isDarkMode,
        isLeftHanded: state.isLeftHanded,
        isDbInitialized: state.isDbInitialized,
        studiedCardIds: state.studiedCardIds,
        savedCardIds: state.savedCardIds,
        favoriteCharacters: Array.from(state.favoriteCharacters),
        favoriteWords: Array.from(state.favoriteWords),
      }),
      onRehydrateStorage: () => state => {
        if (state) {
          // 배열로 저장된 즐겨찾기를 Set으로 복원
          if (Array.isArray((state as any).favoriteCharacters)) {
            state.favoriteCharacters = new Set(
              (state as any).favoriteCharacters
            );
          }
          if (Array.isArray((state as any).favoriteWords)) {
            state.favoriteWords = new Set((state as any).favoriteWords);
          }
        }
      },
    }
  )
);
