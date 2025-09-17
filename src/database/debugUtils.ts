import {
  clearAllDataForDevelopment,
  migrateDataToSQLite,
} from './dataMigration';
import { getBookmarkedWordIds, initializeDatabase } from './hanjaDB';

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
    console.log(`📚 ${grade}: ${(result as any)?.count}개`);
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
 * 특정 단어의 상세 정보 확인 (디버깅용)
 */
export const inspectWord = async (wordId: string): Promise<void> => {
  try {
    const db = await initializeDatabase();

    console.log(`🔍 단어 '${wordId}' 상세 분석:`);

    // 1. 기본 단어 정보 확인
    const wordInfo = await db.getFirstAsync(
      'SELECT * FROM words WHERE id = ?',
      [wordId]
    );

    if (!wordInfo) {
      console.log(`❌ '${wordId}' 단어를 찾을 수 없습니다.`);
      return;
    }

    console.log(
      `📚 단어: ${(wordInfo as any).word}(${(wordInfo as any).pronunciation})`
    );
    console.log(`📖 의미: ${(wordInfo as any).meaning}`);
    console.log(`🎓 급수: ${(wordInfo as any).grade}급`);

    // 2. 관계 테이블 확인
    const relations = await db.getAllAsync(
      'SELECT * FROM word_characters WHERE wordId = ? ORDER BY position',
      [wordId]
    );

    console.log(`🔗 관계 데이터 (${relations.length}개):`);
    relations.forEach((rel: any, index) => {
      console.log(
        `   ${index}: wordId=${rel.wordId}, characterId=${rel.characterId}, position=${rel.position}`
      );
    });

    // 3. 각 한자 정보 확인
    const characters = await db.getAllAsync(
      `SELECT c.*, wc.position 
       FROM characters c
       JOIN word_characters wc ON c.id = wc.characterId
       WHERE wc.wordId = ?
       ORDER BY wc.position`,
      [wordId]
    );

    console.log(`📝 구성 한자 (${characters.length}개):`);
    characters.forEach((char: any) => {
      console.log(
        `   ${char.position}: ${char.character}(${char.pronunciation}) - ${char.meaning} [${char.id}]`
      );
    });

    // 4. 실제 getWordsByGrade에서 사용하는 쿼리 테스트
    const fullQuery = await db.getAllAsync(
      `SELECT w.*, 
       GROUP_CONCAT(c.character || '|' || c.pronunciation || '|' || c.meaning || '|' || 
                   c.strokeCount || '|' || c.radical || '|' || c.radicalName || '|' || 
                   c.radicalStrokes, '@@' ORDER BY wc.position) as characters_data
       FROM words w
       LEFT JOIN word_characters wc ON w.id = wc.wordId
       LEFT JOIN characters c ON wc.characterId = c.id
       WHERE w.id = ?
       GROUP BY w.id`,
      [wordId]
    );

    if (fullQuery.length > 0) {
      const result = fullQuery[0] as any;
      console.log(`🧪 GROUP_CONCAT 결과:`);
      console.log(`   characters_data: ${result.characters_data || 'NULL'}`);

      // parseCharactersData 시뮬레이션
      if (result.characters_data) {
        const parsed = result.characters_data
          .split('@@')
          .map((charData: string) => {
            const parts = charData.split('|');
            return {
              character: parts[0],
              pronunciation: parts[1],
              meaning: parts[2],
              strokeCount: parts[3],
              radical: parts[4],
              radicalName: parts[5],
              radicalStrokes: parts[6],
            };
          });
        console.log(`🔬 파싱된 한자 (${parsed.length}개):`);
        parsed.forEach((char: any, index: number) => {
          console.log(
            `   ${index}: ${char.character}(${char.pronunciation}) - ${char.meaning}`
          );
        });
      }
    }
  } catch (error) {
    console.error(`❌ 단어 '${wordId}' 조사 실패:`, error);
  }
};

/**
 * 데이터베이스 관계 테이블 진단
 */
export const diagnoseDatabaseRelations = async (): Promise<void> => {
  try {
    const db = await initializeDatabase();

    console.log('🔍 데이터베이스 관계 테이블 진단 시작...');

    // 1. 각 테이블의 총 레코드 수 확인
    const wordsCount = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM words'
    );
    const charactersCount = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM characters'
    );
    const relationsCount = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM word_characters'
    );

    console.log(`📊 테이블 현황:`);
    console.log(`   words: ${(wordsCount as any)?.count}개`);
    console.log(`   characters: ${(charactersCount as any)?.count}개`);
    console.log(`   word_characters: ${(relationsCount as any)?.count}개`);

    // 2. 급수별 단어 수와 관계 데이터 수 비교
    const gradeAnalysis = await db.getAllAsync(`
      SELECT 
        w.grade,
        COUNT(DISTINCT w.id) as word_count,
        COUNT(wc.wordId) as relation_count
      FROM words w
      LEFT JOIN word_characters wc ON w.id = wc.wordId
      GROUP BY w.grade
      ORDER BY w.grade DESC
    `);

    console.log(`📊 급수별 분석:`);
    gradeAnalysis.forEach((row: any) => {
      console.log(
        `   ${row.grade}: 단어 ${row.word_count}개, 관계 ${row.relation_count}개`
      );
    });

    // 3. 관계가 없는 단어들 샘플 확인
    const wordsWithoutRelations = await db.getAllAsync(`
      SELECT w.id, w.word, w.grade
      FROM words w
      LEFT JOIN word_characters wc ON w.id = wc.wordId
      WHERE wc.wordId IS NULL
      LIMIT 10
    `);

    console.log(`⚠️ 관계가 없는 단어들 (샘플 10개):`);
    wordsWithoutRelations.forEach((row: any) => {
      console.log(`   ${row.id}: ${row.word} (${row.grade}급)`);
    });

    // 4. 3급 단어 중 첫 5개 상세 분석
    const grade3Words = await db.getAllAsync(`
      SELECT w.id, w.word, w.pronunciation, w.meaning
      FROM words w
      WHERE w.grade = 3
      ORDER BY w.id
      LIMIT 5
    `);

    console.log(`🔬 3급 단어 샘플 분석:`);
    for (const word of grade3Words) {
      const relations = await db.getAllAsync(
        'SELECT * FROM word_characters WHERE wordId = ?',
        [(word as any).id]
      );
      console.log(
        `   ${(word as any).id}: ${(word as any).word} - 관계 ${relations.length}개`
      );
      relations.forEach((rel: any, index) => {
        console.log(
          `      ${index}: characterId=${rel.characterId}, position=${rel.position}`
        );
      });
    }
  } catch (error) {
    console.error('❌ 데이터베이스 관계 진단 실패:', error);
  }
};

/**
 * 앱 스토어 강제 재초기화 (전역 함수용)
 */
export const forceAppReinitialize = async (): Promise<void> => {
  try {
    // 동적으로 useAppStore 임포트 (순환 참조 방지)
    const { useAppStore } = await import('../stores/useAppStore');
    const store = useAppStore.getState();
    await store.forceReinitializeDatabase();
    console.log('✅ 앱 스토어를 통한 재초기화 완료');
  } catch (error) {
    console.error('❌ 앱 스토어 재초기화 실패:', error);
  }
};

/**
 * 북마크된 단어 목록 출력
 */
export const showBookmarkedWords = async (): Promise<void> => {
  try {
    const bookmarkedIds = await getBookmarkedWordIds();
    console.log(`📚 북마크된 단어 ${bookmarkedIds.length}개:`);

    if (bookmarkedIds.length === 0) {
      console.log('   (북마크된 단어가 없습니다)');
      return;
    }

    const db = await initializeDatabase();
    for (const id of bookmarkedIds) {
      const word = await db.getFirstAsync(
        'SELECT word, pronunciation, meaning FROM words WHERE id = ?',
        [id]
      );
      if (word) {
        console.log(
          `   ${(word as any).word} (${(word as any).pronunciation}) - ${(word as any).meaning}`
        );
      }
    }
  } catch (error) {
    console.error('❌ 북마크 목록 조회 실패:', error);
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
      appReset: forceAppReinitialize, // 새로운 함수 추가
      diagnose: diagnoseDatabaseRelations, // 관계 테이블 진단
      bookmarks: showBookmarkedWords, // 북마크 목록 확인
      clearAll: clearAllDataForDevelopment, // ⚠️ 위험: 모든 데이터 삭제
    };

    console.log('🛠️ 디버그 함수들이 등록되었습니다:');
    console.log('   hanjaDebug.status() - 데이터베이스 상태 확인');
    console.log('   hanjaDebug.grade(8) - 특정 급수 단어 개수');
    console.log('   hanjaDebug.inspect("grade7_word_02") - 특정 단어 확인');
    console.log('   hanjaDebug.reset() - 데이터베이스 리셋');
    console.log('   hanjaDebug.fullReset() - 완전 재초기화');
    console.log('   hanjaDebug.appReset() - 앱 스토어 통한 재초기화');
    console.log('   hanjaDebug.diagnose() - 관계 테이블 진단');
    console.log('   hanjaDebug.bookmarks() - 북마크된 단어 목록');
    console.log('   hanjaDebug.clearAll() - ⚠️ 모든 데이터 삭제 (북마크 포함)');
    console.log('');
    console.log(
      '🎯 북마크 문제 해결: 이제 북마크가 앱 재시작 후에도 유지됩니다!'
    );
  }
};
