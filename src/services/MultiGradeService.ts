import { getWordsByGrade } from '../database/hanjaDB';
import { HanjaGrade, HanjaWordCard } from '../types';

/**
 * 다중 급수 관련 서비스
 * 여러 급수에서 단어를 조회하고 랜덤 선택하는 기능 제공
 */
export class MultiGradeService {
  private static instance: MultiGradeService;
  private gradeWordsCache: Map<string, HanjaWordCard[]> = new Map();

  private constructor() {}

  static getInstance(): MultiGradeService {
    if (!MultiGradeService.instance) {
      MultiGradeService.instance = new MultiGradeService();
    }
    return MultiGradeService.instance;
  }

  /**
   * 여러 급수에서 모든 단어를 조회
   * @param grades 조회할 급수 배열
   * @returns 모든 단어들의 배열
   */
  async getWordsByMultipleGrades(
    grades: HanjaGrade[]
  ): Promise<HanjaWordCard[]> {
    if (grades.length === 0) {
      return [];
    }

    // 캐시 키 생성 (정렬된 급수들로)
    const cacheKey = grades.sort((a, b) => a - b).join(',');

    // 캐시된 데이터가 있으면 반환
    if (this.gradeWordsCache.has(cacheKey)) {
      const cachedWords = this.gradeWordsCache.get(cacheKey)!;
      console.log(
        `📚 캐시에서 ${grades.join(',')}급 단어 ${cachedWords.length}개 로드`
      );
      return cachedWords;
    }

    console.log(`🔍 ${grades.join(',')}급 단어 데이터베이스에서 조회 중...`);

    try {
      // 각 급수별로 단어를 조회하고 합치기
      const allWords: HanjaWordCard[] = [];

      for (const grade of grades) {
        const gradeWords = await getWordsByGrade(grade);
        allWords.push(...gradeWords);
        console.log(`📖 ${grade}급: ${gradeWords.length}개 단어`);
      }

      // 중복 제거 (같은 ID의 단어가 있을 수 있음)
      const uniqueWords = this.removeDuplicateWords(allWords);

      console.log(`✅ 총 ${uniqueWords.length}개 단어 (중복 제거 후)`);

      // 캐시에 저장
      this.gradeWordsCache.set(cacheKey, uniqueWords);

      return uniqueWords;
    } catch (error) {
      console.error('❌ 다중 급수 단어 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 여러 급수에서 랜덤한 단어 하나 선택
   * @param grades 조회할 급수 배열
   * @param excludeIds 제외할 단어 ID들 (이미 본 단어 제외)
   * @returns 랜덤 선택된 단어
   */
  async getRandomWordFromMultipleGrades(
    grades: HanjaGrade[],
    excludeIds: string[] = []
  ): Promise<HanjaWordCard | null> {
    const allWords = await this.getWordsByMultipleGrades(grades);

    // 제외할 단어들을 필터링
    const availableWords = allWords.filter(
      word => !excludeIds.includes(word.id)
    );

    if (availableWords.length === 0) {
      console.warn('⚠️ 선택 가능한 단어가 없습니다');
      return null;
    }

    // 랜덤 선택
    const randomIndex = Math.floor(Math.random() * availableWords.length);
    const selectedWord = availableWords[randomIndex];

    console.log(`🎲 랜덤 선택: ${selectedWord.word} (${selectedWord.grade}급)`);

    return selectedWord;
  }

  /**
   * 여러 급수에서 랜덤한 단어들을 여러 개 선택
   * @param grades 조회할 급수 배열
   * @param count 선택할 단어 개수
   * @param excludeIds 제외할 단어 ID들
   * @returns 랜덤 선택된 단어들의 배열
   */
  async getRandomWordsFromMultipleGrades(
    grades: HanjaGrade[],
    count: number,
    excludeIds: string[] = []
  ): Promise<HanjaWordCard[]> {
    const allWords = await this.getWordsByMultipleGrades(grades);

    // 제외할 단어들을 필터링
    const availableWords = allWords.filter(
      word => !excludeIds.includes(word.id)
    );

    if (availableWords.length === 0) {
      return [];
    }

    // Fisher-Yates 셔플 알고리즘으로 랜덤 선택
    const shuffled = [...availableWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selectedWords = shuffled.slice(0, Math.min(count, shuffled.length));

    console.log(`🎲 랜덤 선택: ${selectedWords.length}개 단어`);

    return selectedWords;
  }

  /**
   * 선택된 급수들의 통계 정보 조회
   * @param grades 조회할 급수 배열
   * @returns 급수별 단어 개수 통계
   */
  async getMultiGradeStatistics(grades: HanjaGrade[]): Promise<{
    totalWords: number;
    gradeBreakdown: Record<HanjaGrade, number>;
  }> {
    const allWords = await this.getWordsByMultipleGrades(grades);

    const gradeBreakdown: Record<HanjaGrade, number> = {} as Record<
      HanjaGrade,
      number
    >;

    // 급수별 단어 개수 계산
    for (const grade of grades) {
      gradeBreakdown[grade] = allWords.filter(
        word => word.grade === grade
      ).length;
    }

    return {
      totalWords: allWords.length,
      gradeBreakdown,
    };
  }

  /**
   * 중복 단어 제거 (ID 기준)
   * @param words 단어 배열
   * @returns 중복이 제거된 단어 배열
   */
  private removeDuplicateWords(words: HanjaWordCard[]): HanjaWordCard[] {
    const seen = new Set<string>();
    return words.filter(word => {
      if (seen.has(word.id)) {
        return false;
      }
      seen.add(word.id);
      return true;
    });
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    console.log('🧹 MultiGradeService 캐시 초기화');
    this.gradeWordsCache.clear();
  }
}
