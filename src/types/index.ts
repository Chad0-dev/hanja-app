// 한자 관련 타입 정의
export interface HanjaCharacter {
  id: string;
  character: string; // 한자
  pronunciation: string; // 음독
  meaning: string; // 뜻
  level: number; // 급수 (1~8급)
  strokeCount: number; // 획수
  examples: HanjaExample[]; // 예시 단어들
}

export interface HanjaExample {
  word: string; // 한자 단어
  pronunciation: string; // 발음
  meaning: string; // 뜻
}

// 학습 진도 관련 타입
export interface StudyProgress {
  characterId: string;
  isLearned: boolean;
  isFavorite: boolean;
  studiedAt: Date;
  correctCount: number;
  wrongCount: number;
}

// 검색 필터 타입
export interface SearchFilter {
  level?: number[];
  strokeCount?: {
    min: number;
    max: number;
  };
  searchType: "character" | "pronunciation" | "meaning";
}

// 앱 상태 타입
export interface AppState {
  currentUser: string | null;
  theme: "light" | "dark";
  studySettings: StudySettings;
}

export interface StudySettings {
  dailyGoal: number;
  showPronunciation: boolean;
  showMeaning: boolean;
  reviewMode: "spaced" | "random";
}
