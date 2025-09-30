import * as SQLite from 'expo-sqlite';
import { HanjaCharacter, HanjaGrade, HanjaWordCard } from '../types';

// 데이터베이스 인스턴스
let db: SQLite.SQLiteDatabase | null = null;

/**
 * 데이터베이스 초기화 및 연결
 */
export const initializeDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;

  // 최신 expo-sqlite API 사용
  if (typeof SQLite.openDatabaseSync === 'function') {
    console.log('📦 openDatabaseSync 사용');
    db = SQLite.openDatabaseSync('hanja.db');
  } else if (typeof SQLite.openDatabaseAsync === 'function') {
    console.log('📦 openDatabaseAsync 사용');
    db = await SQLite.openDatabaseAsync('hanja.db');
  } else {
    throw new Error('지원되지 않는 SQLite API 버전');
  }

  // 테이블 생성
  if (typeof SQLite.openDatabaseSync === 'function') {
    // Sync API 사용시 동기적으로 테이블 생성
    createTablesSync();
  } else {
    // Async API 사용시 비동기적으로 테이블 생성
    await createTables();
  }

  // 데이터베이스 스키마 마이그레이션 실행
  await runMigrations();

  console.log('✅ 한자 데이터베이스 초기화 완료');
  return db;
};

/**
 * 테이블 생성 (동기 버전)
 */
const createTablesSync = (): void => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    // 한자 단어 테이블
    db.execSync(`
      CREATE TABLE IF NOT EXISTS words (
        id TEXT PRIMARY KEY,
        word TEXT NOT NULL,
        pronunciation TEXT NOT NULL,
        meaning TEXT NOT NULL,
        grade INTEGER NOT NULL,
        isMemorized BOOLEAN DEFAULT 0,
        is_bookmarked INTEGER DEFAULT 0,
        leftSwipeWords TEXT,
        rightSwipeWords TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 개별 한자 테이블
    db.execSync(`
      CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        character TEXT NOT NULL,
        pronunciation TEXT NOT NULL,
        meaning TEXT NOT NULL,
        strokeCount INTEGER NOT NULL,
        radical TEXT NOT NULL,
        radicalName TEXT NOT NULL,
        radicalStrokes INTEGER NOT NULL
      );
    `);

    // 단어-한자 관계 테이블
    db.execSync(`
      CREATE TABLE IF NOT EXISTS word_characters (
        wordId TEXT,
        characterId TEXT,
        position INTEGER,
        FOREIGN KEY (wordId) REFERENCES words(id),
        FOREIGN KEY (characterId) REFERENCES characters(id),
        PRIMARY KEY (wordId, characterId, position)
      );
    `);

    // 성능 최적화를 위한 인덱스 생성
    db.execSync('CREATE INDEX IF NOT EXISTS idx_words_grade ON words(grade);');
    db.execSync(
      'CREATE INDEX IF NOT EXISTS idx_words_memorized ON words(isMemorized);'
    );
    db.execSync(
      'CREATE INDEX IF NOT EXISTS idx_characters_character ON characters(character);'
    );
    // 추가 성능 최적화 인덱스
    db.execSync(
      'CREATE INDEX IF NOT EXISTS idx_word_characters_wordId ON word_characters(wordId);'
    );
    db.execSync(
      'CREATE INDEX IF NOT EXISTS idx_word_characters_characterId ON word_characters(characterId);'
    );

    console.log('📊 데이터베이스 테이블 및 인덱스 생성 완료 (Sync)');
  } catch (error) {
    console.error('❌ 테이블 생성 실패 (Sync):', error);
    throw error;
  }
};

/**
 * 테이블 생성 (비동기 버전)
 */
const createTables = async (): Promise<void> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    // 한자 단어 테이블
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS words (
        id TEXT PRIMARY KEY,
        word TEXT NOT NULL,
        pronunciation TEXT NOT NULL,
        meaning TEXT NOT NULL,
        grade INTEGER NOT NULL,
        isMemorized BOOLEAN DEFAULT 0,
        is_bookmarked INTEGER DEFAULT 0,
        leftSwipeWords TEXT,
        rightSwipeWords TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 개별 한자 테이블
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        character TEXT NOT NULL,
        pronunciation TEXT NOT NULL,
        meaning TEXT NOT NULL,
        strokeCount INTEGER NOT NULL,
        radical TEXT NOT NULL,
        radicalName TEXT NOT NULL,
        radicalStrokes INTEGER NOT NULL
      );
    `);

    // 단어-한자 관계 테이블
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS word_characters (
        wordId TEXT,
        characterId TEXT,
        position INTEGER,
        FOREIGN KEY (wordId) REFERENCES words(id),
        FOREIGN KEY (characterId) REFERENCES characters(id),
        PRIMARY KEY (wordId, characterId, position)
      );
    `);

    // 성능 최적화를 위한 인덱스 생성
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_words_grade ON words(grade);'
    );
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_words_memorized ON words(isMemorized);'
    );
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_characters_character ON characters(character);'
    );
    // 추가 성능 최적화 인덱스
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_word_characters_wordId ON word_characters(wordId);'
    );
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_word_characters_characterId ON word_characters(characterId);'
    );

    console.log('📊 데이터베이스 테이블 및 인덱스 생성 완료');
  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error);
    throw error;
  }
};

/**
 * 급수별 단어 조회
 */
export const getWordsByGrade = async (
  grade: HanjaGrade
): Promise<HanjaWordCard[]> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    // HanjaGrade 타입 ("3급", "8급" 등)을 숫자로 변환
    const gradeNumber =
      typeof grade === 'string' ? parseInt(grade.replace('급', ''), 10) : grade;

    const result = await db.getAllAsync(
      `SELECT w.*, 
       GROUP_CONCAT(
         CASE 
           WHEN c.character IS NOT NULL THEN 
             c.character || '|' || c.pronunciation || '|' || c.meaning || '|' || 
             c.strokeCount || '|' || c.radical || '|' || c.radicalName || '|' || 
             c.radicalStrokes
           ELSE NULL
         END, 
         '@@' ORDER BY wc.position
       ) as characters_data
       FROM words w
       LEFT JOIN word_characters wc ON w.id = wc.wordId
       LEFT JOIN characters c ON wc.characterId = c.id
       WHERE w.grade = ?
       GROUP BY w.id
       ORDER BY w.createdAt`,
      [gradeNumber]
    );

    const words: HanjaWordCard[] = result.map((row: any) => {
      const characters = reorderCharactersByWord(
        parseCharactersData(row.characters_data),
        row.word
      );

      return {
        id: row.id,
        word: row.word,
        pronunciation: row.pronunciation,
        meaning: row.meaning,
        grade: `${row.grade}급` as HanjaGrade,
        isMemorized: Boolean(row.isMemorized),
        isBookmarked: Boolean(row.is_bookmarked),
        characters,
        relatedWords: {
          leftSwipe: row.leftSwipeWords ? JSON.parse(row.leftSwipeWords) : [],
          rightSwipe: row.rightSwipeWords
            ? JSON.parse(row.rightSwipeWords)
            : [],
        },
      };
    });

    return words;
  } catch (error) {
    throw error;
  }
};

/**
 * 암기 상태별 단어 조회
 */
export const getWordsByMemorized = async (
  isMemorized: boolean
): Promise<HanjaWordCard[]> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const result = await db.getAllAsync(
      `SELECT w.*, 
       GROUP_CONCAT(
         CASE 
           WHEN c.character IS NOT NULL THEN 
             c.character || '|' || c.pronunciation || '|' || c.meaning || '|' || 
             c.strokeCount || '|' || c.radical || '|' || c.radicalName || '|' || 
             c.radicalStrokes
           ELSE NULL
         END, 
         '@@' ORDER BY wc.position
       ) as characters_data
       FROM words w
       LEFT JOIN word_characters wc ON w.id = wc.wordId
       LEFT JOIN characters c ON wc.characterId = c.id
       WHERE w.isMemorized = ?
       GROUP BY w.id
       ORDER BY w.createdAt`,
      [isMemorized ? 1 : 0]
    );

    const words: HanjaWordCard[] = result.map((row: any) => ({
      id: row.id,
      word: row.word,
      pronunciation: row.pronunciation,
      meaning: row.meaning,
      grade: `${row.grade}급` as HanjaGrade,
      isMemorized: Boolean(row.isMemorized),
      characters: reorderCharactersByWord(
        parseCharactersData(row.characters_data),
        row.word
      ),
      relatedWords: {
        leftSwipe: row.leftSwipeWords ? JSON.parse(row.leftSwipeWords) : [],
        rightSwipe: row.rightSwipeWords ? JSON.parse(row.rightSwipeWords) : [],
      },
    }));

    return words;
  } catch (error) {
    throw error;
  }
};

/**
 * 특정 한자를 포함하는 단어 조회
 */
export const getWordsByCharacter = async (
  character: string
): Promise<HanjaWordCard[]> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const result = await db.getAllAsync(
      `SELECT DISTINCT w.*, 
       GROUP_CONCAT(
         CASE 
           WHEN c.character IS NOT NULL THEN 
             c.character || '|' || c.pronunciation || '|' || c.meaning || '|' || 
             c.strokeCount || '|' || c.radical || '|' || c.radicalName || '|' || 
             c.radicalStrokes
           ELSE NULL
         END, 
         '@@' ORDER BY wc.position
       ) as characters_data
       FROM words w
       JOIN word_characters wc ON w.id = wc.wordId
       JOIN characters c ON wc.characterId = c.id
       WHERE w.id IN (
         SELECT DISTINCT wc2.wordId 
         FROM word_characters wc2 
         JOIN characters c2 ON wc2.characterId = c2.id 
         WHERE c2.character = ?
       )
       GROUP BY w.id
       ORDER BY w.createdAt`,
      [character]
    );

    const words: HanjaWordCard[] = result.map((row: any) => ({
      id: row.id,
      word: row.word,
      pronunciation: row.pronunciation,
      meaning: row.meaning,
      grade: `${row.grade}급` as HanjaGrade,
      isMemorized: Boolean(row.isMemorized),
      characters: reorderCharactersByWord(
        parseCharactersData(row.characters_data),
        row.word
      ),
      relatedWords: {
        leftSwipe: row.leftSwipeWords ? JSON.parse(row.leftSwipeWords) : [],
        rightSwipe: row.rightSwipeWords ? JSON.parse(row.rightSwipeWords) : [],
      },
    }));

    return words;
  } catch (error) {
    throw error;
  }
};

/**
 * 단어 암기 상태 업데이트
 */
export const updateWordMemorized = async (
  wordId: string,
  isMemorized: boolean
): Promise<boolean> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const result = await db.runAsync(
      'UPDATE words SET isMemorized = ? WHERE id = ?',
      [isMemorized ? 1 : 0, wordId]
    );

    return result.changes > 0;
  } catch (error) {
    console.error('❌ 암기 상태 업데이트 실패:', error);
    throw error;
  }
};

/**
 * 급수별 통계 조회
 */
export const getGradeStatistics = async (): Promise<
  Record<HanjaGrade, { total: number; memorized: number }>
> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const result = await db.getAllAsync(
      `SELECT grade, 
              COUNT(*) as total,
              SUM(CASE WHEN isMemorized = 1 THEN 1 ELSE 0 END) as memorized
       FROM words 
       GROUP BY grade
       ORDER BY grade DESC`
    );

    const stats: Record<HanjaGrade, { total: number; memorized: number }> = {
      1: { total: 0, memorized: 0 },
      2: { total: 0, memorized: 0 },
      3: { total: 0, memorized: 0 },
      4: { total: 0, memorized: 0 },
      5: { total: 0, memorized: 0 },
      6: { total: 0, memorized: 0 },
      7: { total: 0, memorized: 0 },
      8: { total: 0, memorized: 0 },
    };

    result.forEach((row: any) => {
      const grade = `${row.grade}급` as HanjaGrade;
      stats[grade] = {
        total: row.total,
        memorized: row.memorized,
      };
    });

    return stats;
  } catch (error) {
    console.error('❌ 급수별 통계 조회 실패:', error);
    throw error;
  }
};

/**
 * 한자 순서를 실제 단어 순서와 맞추는 함수
 */
const reorderCharactersByWord = (
  characters: HanjaCharacter[],
  word: string
): HanjaCharacter[] => {
  // 한자가 1개거나 단어가 없으면 그대로 반환
  if (characters.length <= 1 || !word) {
    return characters;
  }

  const wordChars = word.split('');
  const reorderedChars: HanjaCharacter[] = [];

  // 디버깅: 특정 단어만 로그
  const originalOrder = characters.map(c => c.character);

  const isOrderDifferent =
    originalOrder.length > 1 &&
    !originalOrder.every((char, index) => char === wordChars[index]);

  // 단어의 각 한자 순서대로 매칭
  for (let i = 0; i < wordChars.length; i++) {
    const wordChar = wordChars[i];
    const matchingChar = characters.find(c => c.character === wordChar);
    if (matchingChar) {
      reorderedChars.push(matchingChar);
    }
  }

  // 매칭되지 않은 한자들도 추가 (안전장치)
  characters.forEach(char => {
    if (!reorderedChars.find(rc => rc.character === char.character)) {
      reorderedChars.push(char);
    }
  });

  // 디버깅: 순서 보정 후 상태 로그
  if (isOrderDifferent) {
    console.log(
      `✅ 보정 결과: [${reorderedChars.map(c => c.character).join(', ')}]`
    );
  }

  return reorderedChars;
};

/**
 * 문자열로 저장된 한자 데이터를 파싱 (성능 최적화)
 */
const parseCharactersData = (charactersData: string): HanjaCharacter[] => {
  if (
    !charactersData ||
    charactersData === 'null' ||
    charactersData.trim() === ''
  ) {
    console.warn('⚠️ parseCharactersData: 빈 데이터 감지:', charactersData);
    return [];
  }

  try {
    const charDataArray = charactersData.split('@@');
    const characters: HanjaCharacter[] = [];

    // 성능 최적화: for loop 사용, 사전 할당
    for (let i = 0; i < charDataArray.length; i++) {
      const charData = charDataArray[i];
      const parts = charData.split('|');

      // 빠른 검증: 길이만 체크
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

      // 필수 필드만 빠르게 검증
      if (!character || !pronunciation || !meaning) continue;

      // 직접 push로 성능 향상
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
};

/**
 * 단어 북마크 상태 확인
 */
export const isWordBookmarked = async (wordId: string): Promise<boolean> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const result = (await db.getFirstAsync(
      'SELECT is_bookmarked FROM words WHERE id = ?',
      [wordId]
    )) as { is_bookmarked: number } | null;

    return result ? result.is_bookmarked === 1 : false;
  } catch (error) {
    console.error('북마크 상태 확인 실패:', error);
    return false;
  }
};

/**
 * 단어 북마크 토글
 */
export const toggleWordBookmark = async (wordId: string): Promise<boolean> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    // 현재 북마크 상태 확인
    const isBookmarked = await isWordBookmarked(wordId);
    const newBookmarkState = isBookmarked ? 0 : 1;

    // 북마크 상태 업데이트
    await db.runAsync('UPDATE words SET is_bookmarked = ? WHERE id = ?', [
      newBookmarkState,
      wordId,
    ]);

    console.log(
      `📚 단어 ${wordId} 북마크 ${newBookmarkState ? '추가' : '제거'}`
    );
    return newBookmarkState === 1;
  } catch (error) {
    console.error('북마크 토글 실패:', error);
    throw error;
  }
};

/**
 * 북마크된 단어 ID 목록 조회 (간단 버전)
 */
export const getBookmarkedWordIds = async (): Promise<string[]> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const rows = (await db.getAllAsync(
      'SELECT id FROM words WHERE is_bookmarked = 1'
    )) as { id: string }[];

    return rows.map(row => row.id);
  } catch (error) {
    console.error('북마크된 단어 ID 조회 실패:', error);
    return [];
  }
};

/**
 * 북마크된 단어 목록 조회
 */
export const getBookmarkedWords = async (
  grade?: HanjaGrade
): Promise<HanjaWordCard[]> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    let query = `
      SELECT DISTINCT w.*, 
        GROUP_CONCAT(c.character, '') as characters_str,
        GROUP_CONCAT(c.id || '|' || c.character || '|' || c.pronunciation || '|' || 
                    c.meaning || '|' || c.strokeCount || '|' || c.radical || '|' || 
                    c.radicalName || '|' || c.radicalStrokes, '||') as characters_data
      FROM words w
      LEFT JOIN word_characters wc ON w.id = wc.word_id
      LEFT JOIN characters c ON wc.character_id = c.id
      WHERE w.is_bookmarked = 1
    `;

    const params: any[] = [];

    if (grade) {
      const gradeNumber = parseInt(grade.replace('급', ''));
      query += ' AND w.grade = ?';
      params.push(gradeNumber);
    }

    query += ' GROUP BY w.id ORDER BY w.word';

    const rows = (await db.getAllAsync(query, params)) as any[];

    return rows.map(row => ({
      id: row.id,
      word: row.word,
      pronunciation: row.pronunciation,
      meaning: row.meaning,
      grade: `${row.grade}급` as HanjaGrade,
      characters: row.characters_data
        ? row.characters_data.split('||').map((charData: string) => {
            const [
              id,
              character,
              pronunciation,
              meaning,
              strokeCount,
              radical,
              radicalName,
              radicalStrokes,
            ] = charData.split('|');
            return {
              id,
              character,
              pronunciation,
              meaning,
              strokeCount: parseInt(strokeCount),
              radical,
              radicalName,
              radicalStrokes: parseInt(radicalStrokes),
            } as HanjaCharacter;
          })
        : [],
    }));
  } catch (error) {
    console.error('북마크된 단어 조회 실패:', error);
    return [];
  }
};

/**
 * 데이터베이스 스키마 마이그레이션
 */
const runMigrations = async (): Promise<void> => {
  if (!db) return;

  try {
    // 현재 스키마 버전 확인
    const result = (await db.getAllAsync(`PRAGMA table_info(words);`)) as any[];
    const hasBookmarkColumn = result.some(
      (column: any) => column.name === 'is_bookmarked'
    );

    if (!hasBookmarkColumn) {
      console.log('📋 북마크 컬럼 추가 마이그레이션 실행...');

      // is_bookmarked 컬럼 추가
      await db.execAsync(`
        ALTER TABLE words ADD COLUMN is_bookmarked INTEGER DEFAULT 0;
      `);

      console.log('✅ 북마크 컬럼 추가 완료');
    }
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
  }
};

/**
 * 데이터베이스 연결 해제
 */
export const closeDatabase = async () => {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log('📴 데이터베이스 연결 해제');
  }
};
