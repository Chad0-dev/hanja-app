import * as SQLite from 'expo-sqlite';
import { seedHanjaCharacters, seedHanjaWordCards } from '../data/seedData';
import { initializeDatabase } from './hanjaDB';

/**
 * 기존 hanjaWordData.ts 데이터를 SQLite로 마이그레이션
 */
export const migrateDataToSQLite = async (): Promise<void> => {
  console.log('🚀 데이터 마이그레이션 시작...');

  try {
    const db = await initializeDatabase();

    // 기존 데이터 삭제 (개발 중에만 사용)
    await clearExistingData(db);

    // 개별 한자 데이터 삽입
    await insertCharacters(db);

    // 한자 단어 데이터 삽입
    await insertWords(db);

    // 단어-한자 관계 데이터 삽입
    await insertWordCharacterRelations(db);

    console.log('✅ 데이터 마이그레이션 완료!');

    // 마이그레이션 결과 확인
    await verifyMigration(db);
  } catch (error) {
    console.error('❌ 데이터 마이그레이션 실패:', error);
    throw error;
  }
};

/**
 * 기존 데이터 삭제 (개발용)
 */
const clearExistingData = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    await db.execAsync('DELETE FROM word_characters');
    await db.execAsync('DELETE FROM words');
    await db.execAsync('DELETE FROM characters');
    console.log('🗑️ 기존 데이터 삭제 완료');
  } catch (error) {
    console.error('❌ 기존 데이터 삭제 실패:', error);
    throw error;
  }
};

/**
 * 개별 한자 데이터 삽입
 */
const insertCharacters = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  const characters = seedHanjaCharacters;
  let insertedCount = 0;

  try {
    for (const char of characters) {
      await db.runAsync(
        `INSERT INTO characters 
         (id, character, pronunciation, meaning, strokeCount, radical, radicalName, radicalStrokes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          char.id,
          char.character,
          char.pronunciation,
          char.meaning,
          char.strokeCount,
          char.radical,
          char.radicalName,
          char.radicalStrokes,
        ]
      );
      insertedCount++;
    }
    console.log(`📝 개별 한자 ${insertedCount}개 삽입 완료`);
  } catch (error) {
    console.error('❌ 한자 데이터 삽입 실패:', error);
    throw error;
  }
};

/**
 * 한자 단어 데이터 삽입
 */
const insertWords = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  let insertedCount = 0;

  try {
    for (const word of seedHanjaWordCards) {
      await db.runAsync(
        `INSERT INTO words 
         (id, word, pronunciation, meaning, grade, isMemorized, leftSwipeWords, rightSwipeWords) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          word.id,
          word.word,
          word.pronunciation,
          word.meaning,
          word.grade,
          word.isMemorized ? 1 : 0,
          JSON.stringify(word.relatedWords.leftSwipe),
          JSON.stringify(word.relatedWords.rightSwipe),
        ]
      );
      insertedCount++;
    }
    console.log(`📚 한자 단어 ${insertedCount}개 삽입 완료`);
  } catch (error) {
    console.error('❌ 단어 데이터 삽입 실패:', error);
    throw error;
  }
};

/**
 * 단어-한자 관계 데이터 삽입
 */
const insertWordCharacterRelations = async (
  db: SQLite.SQLiteDatabase
): Promise<void> => {
  let insertedCount = 0;
  let totalRelations = 0;

  // 총 관계 수 계산
  seedHanjaWordCards.forEach(word => {
    totalRelations += word.characters.length;
  });

  try {
    for (const word of seedHanjaWordCards) {
      for (let index = 0; index < word.characters.length; index++) {
        const char = word.characters[index];
        await db.runAsync(
          `INSERT INTO word_characters (wordId, characterId, position) 
           VALUES (?, ?, ?)`,
          [word.id, char.id, index]
        );
        insertedCount++;
      }
    }
    console.log(`🔗 단어-한자 관계 ${insertedCount}개 삽입 완료`);
  } catch (error) {
    console.error('❌ 관계 데이터 삽입 실패:', error);
    throw error;
  }
};

/**
 * 마이그레이션 결과 확인
 */
const verifyMigration = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    // 각 테이블의 레코드 수 확인
    const charactersCount = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM characters'
    );
    console.log(`📊 한자 데이터: ${(charactersCount as any)?.count}개`);

    const wordsCount = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM words'
    );
    console.log(`📊 단어 데이터: ${(wordsCount as any)?.count}개`);

    const relationsCount = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM word_characters'
    );
    console.log(`📊 관계 데이터: ${(relationsCount as any)?.count}개`);

    // 급수별 단어 수 확인
    const gradeStats = await db.getAllAsync(
      'SELECT grade, COUNT(*) as count FROM words GROUP BY grade ORDER BY grade DESC'
    );

    console.log('📊 급수별 단어 수:');
    gradeStats.forEach((row: any) => {
      console.log(`   ${row.grade}급: ${row.count}개`);
    });
  } catch (error) {
    console.error('❌ 마이그레이션 검증 실패:', error);
    throw error;
  }
};

/**
 * 데이터베이스 상태 확인 (디버깅용)
 */
export const checkDatabaseStatus = async (): Promise<void> => {
  try {
    const db = await initializeDatabase();
    await verifyMigration(db);
  } catch (error) {
    console.error('❌ 데이터베이스 상태 확인 실패:', error);
  }
};
