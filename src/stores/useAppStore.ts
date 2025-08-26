import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppState, StudyProgress } from "../types";

interface AppStore extends AppState {
  // 상태 업데이트 액션들
  setTheme: (theme: "light" | "dark") => void;
  setCurrentUser: (user: string | null) => void;
  updateStudySettings: (settings: Partial<AppState["studySettings"]>) => void;

  // 학습 진도 관련
  studyProgress: StudyProgress[];
  updateProgress: (progress: StudyProgress) => void;
  toggleFavorite: (characterId: string) => void;
  markAsLearned: (characterId: string) => void;

  // 통계
  getTotalLearned: () => number;
  getFavoriteCount: () => number;
  getAccuracyRate: (characterId?: string) => number;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      currentUser: null,
      theme: "light",
      studySettings: {
        dailyGoal: 10,
        showPronunciation: true,
        showMeaning: true,
        reviewMode: "spaced",
      },
      studyProgress: [],

      // 액션들
      setTheme: (theme) => set({ theme }),
      setCurrentUser: (currentUser) => set({ currentUser }),
      updateStudySettings: (settings) =>
        set((state) => ({
          studySettings: { ...state.studySettings, ...settings },
        })),

      // 학습 진도 관련 액션들
      updateProgress: (progress) =>
        set((state) => {
          const existingIndex = state.studyProgress.findIndex(
            (p) => p.characterId === progress.characterId
          );

          if (existingIndex >= 0) {
            const newProgress = [...state.studyProgress];
            newProgress[existingIndex] = progress;
            return { studyProgress: newProgress };
          } else {
            return { studyProgress: [...state.studyProgress, progress] };
          }
        }),

      toggleFavorite: (characterId) =>
        set((state) => {
          const progress = state.studyProgress.find(
            (p) => p.characterId === characterId
          );

          if (progress) {
            return {
              studyProgress: state.studyProgress.map((p) =>
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

      markAsLearned: (characterId) =>
        set((state) => ({
          studyProgress: state.studyProgress.map((p) =>
            p.characterId === characterId
              ? { ...p, isLearned: true, studiedAt: new Date() }
              : p
          ),
        })),

      // 통계 함수들
      getTotalLearned: () => {
        const { studyProgress } = get();
        return studyProgress.filter((p) => p.isLearned).length;
      },

      getFavoriteCount: () => {
        const { studyProgress } = get();
        return studyProgress.filter((p) => p.isFavorite).length;
      },

      getAccuracyRate: (characterId) => {
        const { studyProgress } = get();

        if (characterId) {
          const progress = studyProgress.find(
            (p) => p.characterId === characterId
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
    }),
    {
      name: "hanja-app-storage", // AsyncStorage 키
      partialize: (state) => ({
        currentUser: state.currentUser,
        theme: state.theme,
        studySettings: state.studySettings,
        studyProgress: state.studyProgress,
      }),
    }
  )
);
