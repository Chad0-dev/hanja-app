import { initializeDatabase } from '../database/hanjaDB';
import { HanjaGrade, HanjaWordCard } from '../types';

/**
 * 스와이프 연관단어 찾기 서비스
 *
 * 스와이프 방향에 따라 연관된 단어들을 찾아서 반환합니다.
 * - 왼쪽 스와이프: 첫 번째 한자와 연관된 단어
 * - 오른쪽 스와이프: 마지막 한자와 연관된 단어
 *
 * 우선순위:
 * 1. 같은 한자가 포함된 단어
 * 2. 같은 부수를 가진 한자가 포함된 단어
 * 3. 랜덤 단어 (연관성이 없을 때)
 */
export class RelatedWordService {
  /**
   * 스와이프 방향에 따른 연관단어 찾기
   */
  static async findRelatedWords(
    currentCard: HanjaWordCard,
    swipeDirection: 'left' | 'right',
    options: {
      selectedGrades: HanjaGrade[];
      excludeRecentIds?: string[];
      recentWords?: string[];
    }
  ): Promise<HanjaWordCard | null> {
    try {
      const {
        selectedGrades,
        excludeRecentIds = [],
        recentWords = [],
      } = options;

      // 스와이프 방향에 따라 대상 한자 결정
      const targetCharacter = this.getTargetCharacter(
        currentCard,
        swipeDirection
      );
      if (!targetCharacter) {
        return null;
      }

      // 1. 같은 한자가 포함된 단어 찾기
      let relatedWords = await this.findWordsWithSameCharacter(
        targetCharacter.character,
        selectedGrades,
        currentCard.id,
        excludeRecentIds,
        currentCard.word,
        recentWords
      );

      if (relatedWords.length > 0) {
        return this.selectRandomWord(relatedWords);
      }

      // 2. 같은 부수를 가진 한자가 포함된 단어 찾기
      relatedWords = await this.findWordsWithSameRadical(
        targetCharacter.radical,
        selectedGrades,
        currentCard.id,
        excludeRecentIds,
        currentCard.word,
        recentWords
      );

      if (relatedWords.length > 0) {
        return this.selectRandomWord(relatedWords);
      }

      // 3. 연관성이 없으면 null 반환 (랜덤 단어는 상위에서 처리)
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 공통 필터링 로직
   */
  private static filterResults(
    results: any[],
    excludeWordId: string,
    excludeRecentIds: string[],
    currentWord: string,
    recentWords: string[]
  ): any[] {
    return results.filter(
      (row: any) =>
        row.id !== excludeWordId &&
        !excludeRecentIds.includes(row.id) &&
        row.word !== currentWord &&
        !recentWords.includes(row.word)
    );
  }

  /**
   * 스와이프 방향에 따라 대상 한자 결정
   */
  private static getTargetCharacter(
    card: HanjaWordCard,
    direction: 'left' | 'right'
  ) {
    if (!card.characters || card.characters.length === 0) {
      return null;
    }

    // 왼쪽 스와이프: 첫 번째 한자, 오른쪽 스와이프: 마지막 한자
    return direction === 'left'
      ? card.characters[0]
      : card.characters[card.characters.length - 1];
  }

  /**
   * 같은 한자가 포함된 단어들 찾기
   */
  private static async findWordsWithSameCharacter(
    character: string,
    selectedGrades: HanjaGrade[],
    excludeWordId: string,
    excludeRecentIds: string[] = [],
    currentWord: string = '',
    recentWords: string[] = []
  ): Promise<HanjaWordCard[]> {
    const db = await initializeDatabase();
    if (!db) return [];

    try {
      // 선택된 급수들을 쿼리에 사용할 수 있도록 변환
      const gradeParams = selectedGrades.map(() => '?').join(',');

      // 최근 ID들을 제외하는 조건 생성
      const excludeRecentCondition =
        excludeRecentIds.length > 0
          ? `AND w2.id NOT IN (${excludeRecentIds.map(() => '?').join(',')})`
          : '';

      const excludeRecentCondition2 =
        excludeRecentIds.length > 0
          ? `AND w.id NOT IN (${excludeRecentIds.map(() => '?').join(',')})`
          : '';

      const query = `
        SELECT DISTINCT w.*, GROUP_CONCAT(c.character || '|' || c.pronunciation || '|' || c.meaning || '|' || c.strokeCount || '|' || c.radical || '|' || c.radicalName || '|' || c.radicalStrokes, '@@' ORDER BY wc.position) as charactersData
        FROM words w
        JOIN word_characters wc ON w.id = wc.wordId
        JOIN characters c ON wc.characterId = c.id
        WHERE w.id IN (
          SELECT DISTINCT w2.id
          FROM words w2
          JOIN word_characters wc2 ON w2.id = wc2.wordId
          JOIN characters c2 ON wc2.characterId = c2.id
          WHERE c2.character = ?
          AND w2.grade IN (${gradeParams})
          AND w2.id != ?
          ${excludeRecentCondition}
        )
        AND w.grade IN (${gradeParams})
        ${excludeRecentCondition2}
        GROUP BY w.id
        ORDER BY RANDOM()
        LIMIT 15
      `;

      const params = [
        character,
        ...selectedGrades,
        excludeWordId,
        ...(excludeRecentIds.length > 0 ? excludeRecentIds : []),
        ...selectedGrades,
        ...(excludeRecentIds.length > 0 ? excludeRecentIds : []),
      ];
      const result = await db.getAllAsync(query, params);

      // 추가 안전장치: 현재 카드와 최근 카드들 한번 더 필터링
      const filteredResults = this.filterResults(
        result,
        excludeWordId,
        excludeRecentIds,
        currentWord,
        recentWords
      );

      return this.parseWordResults(filteredResults);
    } catch (error) {
      return [];
    }
  }

  /**
   * 같은 부수를 가진 한자가 포함된 단어들 찾기
   */
  private static async findWordsWithSameRadical(
    radical: string,
    selectedGrades: HanjaGrade[],
    excludeWordId: string,
    excludeRecentIds: string[] = [],
    currentWord: string = '',
    recentWords: string[] = []
  ): Promise<HanjaWordCard[]> {
    const db = await initializeDatabase();
    if (!db) return [];

    try {
      // 선택된 급수들을 쿼리에 사용할 수 있도록 변환
      const gradeParams = selectedGrades.map(() => '?').join(',');

      // 최근 ID들을 제외하는 조건 생성
      const excludeRecentCondition =
        excludeRecentIds.length > 0
          ? `AND w2.id NOT IN (${excludeRecentIds.map(() => '?').join(',')})`
          : '';

      const excludeRecentCondition2 =
        excludeRecentIds.length > 0
          ? `AND w.id NOT IN (${excludeRecentIds.map(() => '?').join(',')})`
          : '';

      const query = `
        SELECT DISTINCT w.*, GROUP_CONCAT(c.character || '|' || c.pronunciation || '|' || c.meaning || '|' || c.strokeCount || '|' || c.radical || '|' || c.radicalName || '|' || c.radicalStrokes, '@@' ORDER BY wc.position) as charactersData
        FROM words w
        JOIN word_characters wc ON w.id = wc.wordId
        JOIN characters c ON wc.characterId = c.id
        WHERE w.id IN (
          SELECT DISTINCT w2.id
          FROM words w2
          JOIN word_characters wc2 ON w2.id = wc2.wordId
          JOIN characters c2 ON wc2.characterId = c2.id
          WHERE c2.radical = ?
          AND w2.grade IN (${gradeParams})
          AND w2.id != ?
          ${excludeRecentCondition}
        )
        AND w.grade IN (${gradeParams})
        ${excludeRecentCondition2}
        GROUP BY w.id
        ORDER BY RANDOM()
        LIMIT 15
      `;

      const params = [
        radical,
        ...selectedGrades,
        excludeWordId,
        ...(excludeRecentIds.length > 0 ? excludeRecentIds : []),
        ...selectedGrades,
        ...(excludeRecentIds.length > 0 ? excludeRecentIds : []),
      ];
      const result = await db.getAllAsync(query, params);

      // 추가 안전장치: 현재 카드와 최근 카드들 한번 더 필터링
      const filteredResults = this.filterResults(
        result,
        excludeWordId,
        excludeRecentIds,
        currentWord,
        recentWords
      );

      return this.parseWordResults(filteredResults);
    } catch (error) {
      return [];
    }
  }

  /**
   * 데이터베이스 결과를 HanjaWordCard 객체로 변환
   */
  private static parseWordResults(results: any[]): HanjaWordCard[] {
    return results.map((row: any) => ({
      id: row.id,
      word: row.word,
      pronunciation: row.pronunciation,
      meaning: row.meaning,
      grade: `${row.grade}급` as HanjaGrade,
      isMemorized: Boolean(row.isMemorized),
      characters: this.parseCharactersData(row.charactersData || ''),
      relatedWords: {
        leftSwipe: [],
        rightSwipe: [],
      },
    }));
  }

  /**
   * 문자열로 저장된 한자 데이터를 파싱
   */
  private static parseCharactersData(charactersData: string) {
    if (
      !charactersData ||
      charactersData === 'null' ||
      charactersData.trim() === ''
    ) {
      return [];
    }

    try {
      const charDataArray = charactersData.split('@@');
      const characters = [];

      for (let i = 0; i < charDataArray.length; i++) {
        const charData = charDataArray[i];
        const parts = charData.split('|');

        if (parts.length < 7) continue;

        const [
          character,
          pronunciation,
          meaning,
          strokeCount,
          radical,
          radicalName,
          radicalStrokes,
        ] = parts;

        if (!character || !pronunciation || !meaning) continue;

        characters.push({
          id: `char_${character}`,
          character,
          pronunciation,
          meaning,
          strokeCount: parseInt(strokeCount) || 0,
          radical: radical || '',
          radicalName: radicalName || '',
          radicalStrokes: parseInt(radicalStrokes) || 0,
        });
      }

      return characters;
    } catch (error) {
      return [];
    }
  }

  /**
   * 배열에서 랜덤하게 하나의 단어 선택
   */
  private static selectRandomWord(words: HanjaWordCard[]): HanjaWordCard {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
  }

  /**
   * 디버깅용: 연관단어 검색 통계
   */
  static async getRelatedWordsStats(
    character: string,
    selectedGrades: HanjaGrade[]
  ): Promise<{
    sameCharacterCount: number;
    sameRadicalCount: number;
    totalAvailable: number;
  }> {
    try {
      const sameCharWords = await this.findWordsWithSameCharacter(
        character,
        selectedGrades,
        'dummy_exclude'
      );

      // 부수 정보를 얻기 위해 한자 정보 조회
      const db = await initializeDatabase();
      if (!db)
        return {
          sameCharacterCount: 0,
          sameRadicalCount: 0,
          totalAvailable: 0,
        };

      const charInfo = await db.getFirstAsync(
        'SELECT radical FROM characters WHERE character = ?',
        [character]
      );

      let sameRadicalWords: HanjaWordCard[] = [];
      if (charInfo) {
        sameRadicalWords = await this.findWordsWithSameRadical(
          (charInfo as any).radical,
          selectedGrades,
          'dummy_exclude'
        );
      }

      const gradeParams = selectedGrades.map(() => '?').join(',');
      const totalResult = await db.getFirstAsync(
        `SELECT COUNT(*) as total FROM words WHERE grade IN (${gradeParams})`,
        selectedGrades
      );

      return {
        sameCharacterCount: sameCharWords.length,
        sameRadicalCount: sameRadicalWords.length,
        totalAvailable: (totalResult as any)?.total || 0,
      };
    } catch (error) {
      return { sameCharacterCount: 0, sameRadicalCount: 0, totalAvailable: 0 };
    }
  }
}
