import { migrateDataToSQLite } from './dataMigration';
import { initializeDatabase } from './hanjaDB';

/**
 * 개발용 디버깅 유틸리티 함수들
 */

/**
 * 데이터베이스 전체 상태 출력
 */
export const logDatabaseStatus = async (): Promise<void> => {
  try {
    const db = await initializeDatabase();

    console.log('📊 =================================');
    console.log('📊 데이터베이스 상태 확인');
    console.log('📊 =================================');

    // 각 테이블의 레코드 수
    const charactersCount = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM characters'
    );
    console.log(`📝 개별 한자: ${(charactersCount as any)?.count}개`);

    const wordsCount = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM words'
    );
    console.log(`📚 한자 단어: ${(wordsCount as any)?.count}개`);

    const relationsCount = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM word_characters'
    );
    console.log(`🔗 관계 데이터: ${(relationsCount as any)?.count}개`);

    // 급수별 통계
    const gradeStats = await db.getAllAsync(
      'SELECT grade, COUNT(*) as total, SUM(CASE WHEN isMemorized = 1 THEN 1 ELSE 0 END) as memorized FROM words GROUP BY grade ORDER BY grade DESC'
    );

    console.log('📊 급수별 통계:');
    gradeStats.forEach((row: any) => {
      const percentage =
        row.total > 0 ? Math.round((row.memorized / row.total) * 100) : 0;
      console.log(
        `   ${row.grade}급: ${row.memorized}/${row.total} (${percentage}%)`
      );
    });

    // 샘플 데이터 확인
    const sampleData = await db.getAllAsync(
      'SELECT w.word, w.pronunciation, w.meaning, w.grade FROM words w LIMIT 3'
    );

    console.log('📋 샘플 데이터:');
    sampleData.forEach((row: any) => {
      console.log(
        `   ${row.word}(${row.pronunciation}): ${row.meaning} [${row.grade}급]`
      );
    });

    console.log('📊 =================================');
  } catch (error) {
    console.error('❌ 데이터베이스 상태 확인 실패:', error);
  }
};

/**
 * 특정 급수의 단어 개수만 확인 (간소화)
 */
export const checkGradeCount = async (grade: number): Promise<void> => {
  try {
    const db = await initializeDatabase();
    const result = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM words WHERE grade = ?',
      [grade]
    );
    console.log(`📚 ${grade}급: ${(result as any)?.count}개`);
  } catch (error) {
    console.error(`❌ ${grade}급 확인 실패:`, error);
  }
};

/**
 * 데이터베이스 리셋 (개발용)
 */
export const resetDatabase = async (): Promise<void> => {
  try {
    const db = await initializeDatabase();

    console.log('🗑️ 데이터베이스 리셋 시작...');

    await db.execAsync('DELETE FROM word_characters');
    await db.execAsync('DELETE FROM words');
    await db.execAsync('DELETE FROM characters');

    console.log('🗑️ 모든 데이터 삭제 완료');
    console.log('✅ 데이터베이스 리셋 완료');
  } catch (error) {
    console.error('❌ 데이터베이스 리셋 실패:', error);
  }
};

/**
 * 데이터베이스 완전 재초기화 (리셋 + 마이그레이션)
 */
export const resetAndMigrate = async (): Promise<void> => {
  try {
    console.log('🔄 데이터베이스 완전 재초기화 시작...');

    // 1. 데이터베이스 리셋
    await resetDatabase();

    // 2. 새로운 데이터 마이그레이션
    console.log('📦 새로운 데이터 마이그레이션 시작...');
    await migrateDataToSQLite();

    console.log('✅ 완전 재초기화 완료');
  } catch (error) {
    console.error('❌ 완전 재초기화 실패:', error);
  }
};

/**
 * 특정 단어의 기본 정보만 확인 (간소화)
 */
export const inspectWord = async (wordId: string): Promise<void> => {
  try {
    const db = await initializeDatabase();

    // 간단한 조인 쿼리로 핵심 정보만 확인
    const result = await db.getAllAsync(
      `SELECT w.word, w.pronunciation, w.meaning, 
       GROUP_CONCAT(c.character, '') as characters
       FROM words w
       LEFT JOIN word_characters wc ON w.id = wc.wordId
       LEFT JOIN characters c ON wc.characterId = c.id
       WHERE w.id = ?
       GROUP BY w.id`,
      [wordId]
    );

    if (result.length > 0) {
      const word = result[0] as any;
      console.log(`🔍 ${word.word}(${word.pronunciation}): ${word.meaning}`);
      console.log(`📝 구성한자: ${word.characters || '없음'}`);
    } else {
      console.log(`❌ '${wordId}' 단어를 찾을 수 없습니다.`);
    }
  } catch (error) {
    console.error(`❌ 단어 '${wordId}' 조사 실패:`, error);
  }
};

/**
 * 개발자 콘솔에서 사용할 수 있는 전역 함수들 등록 (최적화)
 */
export const registerDebugFunctions = (): void => {
  if (__DEV__) {
    // @ts-ignore
    global.hanjaDebug = {
      status: logDatabaseStatus,
      grade: checkGradeCount, // 간소화된 함수로 변경
      inspect: inspectWord,
      reset: resetDatabase,
      fullReset: resetAndMigrate,
    };

    console.log('🛠️ 디버그 함수들이 등록되었습니다:');
    console.log('   hanjaDebug.status() - 데이터베이스 상태 확인');
    console.log('   hanjaDebug.grade(8) - 특정 급수 단어 개수');
    console.log('   hanjaDebug.inspect("method") - 특정 단어 확인');
    console.log('   hanjaDebug.reset() - 데이터베이스 리셋');
    console.log('   hanjaDebug.fullReset() - 완전 재초기화');
  }
};
