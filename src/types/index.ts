// 한자 급수 타입 정의
export type HanjaGrade =
  | '1급'
  | '2급'
  | '3급'
  | '4급'
  | '5급'
  | '6급'
  | '7급'
  | '8급';

// 한자 단어 카드 타입 정의 (개선됨)
export interface HanjaWordCard {
  id: string;
  word: string; // 한자 단어 (예: "天地")
  pronunciation: string; // 발음 (예: "천지")
  meaning: string; // 단어 뜻 (예: "하늘과 땅")
  characters: HanjaCharacter[]; // 구성 한자들
  grade: HanjaGrade; // 급수 (8급이 가장 쉬움, 1급이 가장 어려움)
  isMemorized: boolean; // 암기 완료 여부
  isBookmarked?: boolean; // 북마크 여부
  relatedWords: {
    leftSwipe: string[]; // 첫 번째 한자 관련 단어 IDs
    rightSwipe: string[]; // 두 번째 한자 관련 단어 IDs
  };
}

// 개별 한자 정보 타입 (간소화됨)
export interface HanjaCharacter {
  id: string;
  character: string; // 한자 (예: "天")
  pronunciation: string; // 음독 (예: "천")
  meaning: string; // 뜻 (예: "하늘")
  strokeCount: number; // 획수
  radical: string; // 부수 (예: "大")
  radicalName: string; // 부수 이름 (예: "큰대")
  radicalStrokes: number; // 부수 획수
  // examples 제거 - character 기반으로 자동 연결
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

// 검색 필터 타입 (개선됨)
export interface SearchFilter {
  grade?: HanjaGrade[]; // 급수별 필터링
  strokeCount?: {
    min: number;
    max: number;
  };
  memorized?: boolean; // 암기 상태별 필터링
  searchType: 'character' | 'pronunciation' | 'meaning';
}

// 앱 상태 타입
export interface AppState {
  currentUser: string | null;
  theme: 'light' | 'dark';
  studySettings: StudySettings;
}

export interface StudySettings {
  dailyGoal: number;
  showPronunciation: boolean;
  showMeaning: boolean;
  reviewMode: 'spaced' | 'random';
}

// 카드 히스토리 타입 (스와이프 방향 포함)
export interface CardHistoryItem {
  card: HanjaWordCard;
  swipeDirection: 'left' | 'right'; // 어느 방향으로 스와이프했는지
}
