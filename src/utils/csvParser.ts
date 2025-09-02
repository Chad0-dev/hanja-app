import { HanjaCharacter } from '../types';

/**
 * CSV 데이터를 파싱하는 유틸리티
 * React Native에서는 로컬 파일을 직접 읽을 수 없으므로
 * 빌드 타임에 CSV를 TypeScript로 변환하여 사용
 */

// meaning 필드 파싱 함수 ([[['학교'], ['교']]] 형태)
const parseMeaning = (
  meaningStr: string
): { meaning: string; pronunciation: string } => {
  try {
    // 정규표현식으로 의미와 발음 추출
    const pattern = /\[\[\['([^']+)'\], \['([^']+)'\]\]\]/;
    const match = meaningStr.match(pattern);

    if (match) {
      return {
        meaning: match[1],
        pronunciation: match[2],
      };
    }

    // 파싱 실패 시 기본값 반환
    return {
      meaning: meaningStr,
      pronunciation: '',
    };
  } catch (error) {
    console.warn('meaning 파싱 실패:', meaningStr, error);
    return {
      meaning: meaningStr,
      pronunciation: '',
    };
  }
};

// CSV 행을 HanjaCharacter 객체로 변환
const parseCSVRow = (
  row: string[],
  grade: number,
  index: number
): HanjaCharacter => {
  const [mainSound, level, hanja, meaning, radical, strokes, totalStrokes] =
    row;

  const { meaning: parsedMeaning, pronunciation } = parseMeaning(meaning);

  return {
    id: `grade${grade}_char_${index.toString().padStart(2, '0')}`,
    character: hanja,
    pronunciation: pronunciation || mainSound,
    meaning: parsedMeaning,
    strokeCount: parseInt(totalStrokes) || 0,
    radical: radical || '',
    radicalName: `${radical}부`,
    radicalStrokes: parseInt(strokes) || 0,
  };
};

// CSV 텍스트를 파싱하는 함수
export const parseCSVText = (
  csvText: string,
  grade: number
): HanjaCharacter[] => {
  try {
    console.log(`📖 ${grade}급 CSV 데이터 파싱 중...`);

    const lines = csvText.split('\n').filter(line => line.trim());

    // 헤더 제거
    const dataLines = lines.slice(1);

    const characters: HanjaCharacter[] = dataLines.map((line, index) => {
      const row = line.split(',');
      return parseCSVRow(row, grade, index + 1);
    });

    console.log(`✅ ${grade}급 한자 ${characters.length}개 파싱 완료`);
    return characters;
  } catch (error) {
    console.error(`❌ ${grade}급 CSV 파싱 실패:`, error);
    throw error;
  }
};
