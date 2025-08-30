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
 * 특정 급수의 모든 단어 출력
 */
export const logWordsForGrade = async (grade: number): Promise<void> => {
  try {
    const db = await initializeDatabase();

    const words = await db.getAllAsync(
      'SELECT word, pronunciation, meaning, isMemorized FROM words WHERE grade = ? ORDER BY word',
      [grade]
    );

    console.log(`📚 ${grade}급 한자 단어 (${words.length}개):`);
    words.forEach((row: any, index: number) => {
      const status = row.isMemorized ? '✅' : '⏳';
      console.log(
        `   ${index + 1}. ${status} ${row.word}(${row.pronunciation}): ${row.meaning}`
      );
    });
  } catch (error) {
    console.error(`❌ ${grade}급 단어 조회 실패:`, error);
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
 * 성능 테스트
 */
export const performanceTest = async (): Promise<void> => {
  try {
    const db = await initializeDatabase();

    console.log('⚡ 성능 테스트 시작...');

    const startTime = Date.now();

    // 급수별 조회 테스트
    for (let grade = 8; grade >= 1; grade--) {
      await db.getAllAsync(
        'SELECT COUNT(*) as count FROM words WHERE grade = ?',
        [grade]
      );
    }

    // 복잡한 조인 쿼리 테스트
    const result = await db.getAllAsync(`
      SELECT w.word, c.character 
      FROM words w 
      JOIN word_characters wc ON w.id = wc.wordId 
      JOIN characters c ON wc.characterId = c.id 
      WHERE w.grade = 8
    `);

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`⚡ 성능 테스트 완료: ${duration}ms`);
    console.log(`⚡ 조회된 레코드 수: ${result.length}개`);
  } catch (error) {
    console.error('❌ 성능 테스트 실패:', error);
  }
};

/**
 * 개발자 콘솔에서 사용할 수 있는 전역 함수들 등록
 */
export const registerDebugFunctions = (): void => {
  if (__DEV__) {
    // @ts-ignore
    global.hanjaDebug = {
      status: logDatabaseStatus,
      grade: logWordsForGrade,
      reset: resetDatabase,
      performance: performanceTest,
    };

    console.log('🛠️ 디버그 함수들이 등록되었습니다:');
    console.log('   hanjaDebug.status() - 데이터베이스 상태 확인');
    console.log('   hanjaDebug.grade(8) - 특정 급수 단어 출력');
    console.log('   hanjaDebug.reset() - 데이터베이스 리셋');
    console.log('   hanjaDebug.performance() - 성능 테스트');
  }
};
