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
    const result = await db.getAllAsync(
      `SELECT w.*, 
       GROUP_CONCAT(c.character || '|' || c.pronunciation || '|' || c.meaning || '|' || 
                   c.strokeCount || '|' || c.radical || '|' || c.radicalName || '|' || 
                   c.radicalStrokes, '@@' ORDER BY wc.position) as characters_data
       FROM words w
       LEFT JOIN word_characters wc ON w.id = wc.wordId
       LEFT JOIN characters c ON wc.characterId = c.id
       WHERE w.grade = ?
       GROUP BY w.id
       ORDER BY w.createdAt`,
      [grade]
    );

    const words: HanjaWordCard[] = result.map((row: any) => ({
      id: row.id,
      word: row.word,
      pronunciation: row.pronunciation,
      meaning: row.meaning,
      grade: row.grade as HanjaGrade,
      isMemorized: Boolean(row.isMemorized),
      characters: parseCharactersData(row.characters_data),
      relatedWords: {
        leftSwipe: row.leftSwipeWords ? JSON.parse(row.leftSwipeWords) : [],
        rightSwipe: row.rightSwipeWords ? JSON.parse(row.rightSwipeWords) : [],
      },
    }));

    return words;
  } catch (error) {
    console.error('❌ 급수별 단어 조회 실패:', error);
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
       GROUP_CONCAT(c.character || '|' || c.pronunciation || '|' || c.meaning || '|' || 
                   c.strokeCount || '|' || c.radical || '|' || c.radicalName || '|' || 
                   c.radicalStrokes, '@@' ORDER BY wc.position) as characters_data
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
      grade: row.grade as HanjaGrade,
      isMemorized: Boolean(row.isMemorized),
      characters: parseCharactersData(row.characters_data),
      relatedWords: {
        leftSwipe: row.leftSwipeWords ? JSON.parse(row.leftSwipeWords) : [],
        rightSwipe: row.rightSwipeWords ? JSON.parse(row.rightSwipeWords) : [],
      },
    }));

    return words;
  } catch (error) {
    console.error('❌ 암기 상태별 단어 조회 실패:', error);
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
       GROUP_CONCAT(c.character || '|' || c.pronunciation || '|' || c.meaning || '|' || 
                   c.strokeCount || '|' || c.radical || '|' || c.radicalName || '|' || 
                   c.radicalStrokes, '@@' ORDER BY wc.position) as characters_data
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
      grade: row.grade as HanjaGrade,
      isMemorized: Boolean(row.isMemorized),
      characters: parseCharactersData(row.characters_data),
      relatedWords: {
        leftSwipe: row.leftSwipeWords ? JSON.parse(row.leftSwipeWords) : [],
        rightSwipe: row.rightSwipeWords ? JSON.parse(row.rightSwipeWords) : [],
      },
    }));

    return words;
  } catch (error) {
    console.error('❌ 한자별 단어 조회 실패:', error);
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

    if (result.changes > 0) {
      console.log(`✅ 단어 ${wordId} 암기 상태 업데이트: ${isMemorized}`);
      return true;
    } else {
      console.warn(`⚠️ 단어 ${wordId} 업데이트 실패: 해당 단어를 찾을 수 없음`);
      return false;
    }
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
      const grade = row.grade as HanjaGrade;
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
 * 문자열로 저장된 한자 데이터를 파싱
 */
const parseCharactersData = (charactersData: string): HanjaCharacter[] => {
  if (!charactersData) return [];

  return charactersData.split('@@').map(charData => {
    const [
      character,
      pronunciation,
      meaning,
      strokeCount,
      radical,
      radicalName,
      radicalStrokes,
    ] = charData.split('|');
    return {
      id: `char_${character}`,
      character,
      pronunciation,
      meaning,
      strokeCount: parseInt(strokeCount),
      radical,
      radicalName,
      radicalStrokes: parseInt(radicalStrokes),
    };
  });
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
