import * as SQLite from 'expo-sqlite';
import wordDataJson from '../data/wordData.json';
import { characterData } from '../data/characterData';
import { HanjaWordCard } from '../types';
import { initializeDatabase } from './hanjaDB';

const wordData = wordDataJson as HanjaWordCard[];

/**
 * 복잡한 의미 필드를 단순한 문자열로 변환
 * 예: [[['학교'], ['교']]] → '학교'
 */
const parseMeaning = (meaningStr: string): string => {
  try {
    if (meaningStr.includes('[[') && meaningStr.includes(']]')) {
      const firstQuoteIndex = meaningStr.indexOf("'");
      const secondQuoteIndex = meaningStr.indexOf("'", firstQuoteIndex + 1);

      if (firstQuoteIndex !== -1 && secondQuoteIndex !== -1) {
        const extracted = meaningStr.substring(
          firstQuoteIndex + 1,
          secondQuoteIndex
        );
        return extracted.replace(/\\'/g, "'");
      }
    }
    return meaningStr;
  } catch (error) {
    console.warn('의미 파싱 실패:', meaningStr, error);
    return meaningStr;
  }
};

/**
 * CSV 파일 기반 데이터를 SQLite로 마이그레이션
 */
export const migrateDataToSQLite = async (): Promise<void> => {
  console.log('🚀 CSV 기반 데이터 마이그레이션 시작...');

  try {
    const db = await initializeDatabase();

    // 데이터가 이미 존재하는지 확인
    const existingWordsCount = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM words'
    );
    const wordsCount = (existingWordsCount as any)?.count || 0;

    if (wordsCount > 0) {
      console.log(`📊 기존 데이터 발견: ${wordsCount}개 단어`);
      console.log('✅ 마이그레이션 건너뛰기 (데이터 보존)');
      return;
    }

    console.log('📝 새로운 데이터베이스 - 초기 데이터 삽입 시작');

    // characterData.ts에서 한자 데이터 삽입
    await insertCharactersFromData(db);

    // 완성 단어 데이터 삽입
    await insertWordsFromData(db);

    // 단어-한자 관계 데이터 삽입
    await insertWordCharacterRelations(db);

    console.log('✅ CSV 기반 데이터 마이그레이션 완료!');

    // 마이그레이션 결과 확인
    await verifyMigration(db);
  } catch (error) {
    console.error('❌ 데이터 마이그레이션 실패:', error);
    throw error;
  }
};

/**
 * 기존 데이터 삭제 (개발용 - 북마크 포함 모든 데이터 삭제)
 * ⚠️ 주의: 이 함수는 북마크를 포함한 모든 사용자 데이터를 삭제합니다!
 */
export const clearAllDataForDevelopment = async (): Promise<void> => {
  try {
    const db = await initializeDatabase();
    await db.execAsync('DELETE FROM word_characters');
    await db.execAsync('DELETE FROM words');
    await db.execAsync('DELETE FROM characters');
    console.log('🗑️ 개발용: 모든 데이터 삭제 완료 (북마크 포함)');

    // 데이터 삭제 후 재마이그레이션
    await migrateDataToSQLite();
  } catch (error) {
    console.error('❌ 개발용 데이터 삭제 실패:', error);
    throw error;
  }
};

/**
 * characterData.ts에서 한자 데이터를 삽입
 */
const insertCharactersFromData = async (
  db: SQLite.SQLiteDatabase
): Promise<void> => {
  try {
    console.log('📖 characterData.ts에서 한자 데이터 로드 중...');

    const characters = characterData;
    let insertedCount = 0;

    for (const char of characters) {
      await db.runAsync(
        `INSERT INTO characters 
         (id, character, pronunciation, meaning, strokeCount, radical, radicalName, radicalStrokes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          char.id,
          char.character,
          char.pronunciation,
          parseMeaning(char.meaning),
          char.strokeCount,
          char.radical,
          char.radicalName,
          char.radicalStrokes,
        ]
      );
      insertedCount++;
    }

    console.log(
      `📝 characterData에서 로드된 한자 ${insertedCount}개 삽입 완료`
    );
  } catch (error) {
    console.error('❌ 한자 데이터 삽입 실패:', error);
    throw error;
  }
};

/**
 * wordData.ts에서 완성 단어 데이터를 삽입
 */
const insertWordsFromData = async (
  db: SQLite.SQLiteDatabase
): Promise<void> => {
  try {
    console.log('📖 wordData.json에서 완성 단어 데이터 로드 중...');

    const words = wordData;
    let insertedCount = 0;

    for (const word of words) {
      await db.runAsync(
        `INSERT INTO words 
         (id, word, pronunciation, meaning, grade, isMemorized, leftSwipeWords, rightSwipeWords) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          word.id,
          word.word,
          word.pronunciation,
          word.meaning,
          typeof word.grade === 'string'
            ? parseInt(word.grade.replace('급', ''), 10)
            : word.grade,
          word.isMemorized ? 1 : 0,
          JSON.stringify(word.relatedWords.leftSwipe),
          JSON.stringify(word.relatedWords.rightSwipe),
        ]
      );
      insertedCount++;
    }

    console.log(
      `📚 wordData.json에서 로드된 완성 단어 ${insertedCount}개 삽입 완료`
    );
  } catch (error) {
    console.error('❌ 완성 단어 데이터 삽입 실패:', error);
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
  let skippedCount = 0;
  let totalRelations = 0;

  // 총 관계 수 계산
  wordData.forEach(word => {
    totalRelations += word.characters.length;
  });

  console.log(`🔗 총 ${totalRelations}개 관계 데이터 삽입 시작...`);

  try {
    for (const word of wordData) {
      for (let index = 0; index < word.characters.length; index++) {
        const char = word.characters[index];

        try {
          await db.runAsync(
            `INSERT INTO word_characters (wordId, characterId, position) 
             VALUES (?, ?, ?)`,
            [word.id, char.id, index]
          );
          insertedCount++;
        } catch (relationError) {
          console.warn(
            `⚠️ 관계 삽입 실패: ${word.word}[${index}] - ${char.character} (${char.id})`
          );
          skippedCount++;
        }
      }
    }
    console.log(`🔗 단어-한자 관계 삽입 완료:`);
    console.log(`   성공: ${insertedCount}개`);
    console.log(`   실패: ${skippedCount}개`);
    console.log(`   총계: ${totalRelations}개`);
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
      console.log(`   ${row.grade}: ${row.count}개`);
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
