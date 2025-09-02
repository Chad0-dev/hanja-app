const fs = require('fs');
const path = require('path');

// CSV 파일을 읽고 파싱하는 함수
const parseCSVFile = (filePath, grade) => {
  const csvContent = fs.readFileSync(filePath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  // 헤더 제거
  const dataLines = lines.slice(1);

  const characters = dataLines.map((line, index) => {
    // CSV 파싱을 위해 정규표현식 사용 (따옴표 안의 쉼표 고려)
    const row = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const [mainSound, level, hanja, meaning, radical, strokes, totalStrokes] =
      row;

    // meaning 파싱 (따옴표 제거)
    let parsedMeaning = meaning ? meaning.replace(/^"|"$/g, '') : '';
    let pronunciation = mainSound;

    try {
      const pattern = /\[\[\['([^']+)'\], \['([^']+)'\]\]\]/;
      const match = parsedMeaning.match(pattern);
      if (match) {
        parsedMeaning = match[1];
        pronunciation = match[2];
      }
    } catch (error) {
      console.warn(`meaning 파싱 실패: ${parsedMeaning}`);
    }

    // TypeScript 문자열에서 작은따옴표 이스케이프 처리
    parsedMeaning = parsedMeaning.replace(/'/g, "\\'");
    pronunciation = pronunciation.replace(/'/g, "\\'");

    return {
      id: `grade${grade}_char_${(index + 1).toString().padStart(2, '0')}`,
      character: hanja,
      pronunciation: pronunciation,
      meaning: parsedMeaning,
      strokeCount: parseInt(totalStrokes) || 0,
      radical: radical || '',
      radicalName: `${radical}부`,
      radicalStrokes: parseInt(strokes) || 0,
    };
  });

  return characters;
};

// TypeScript 파일 생성
const generateTypeScriptFile = allCharacters => {
  let content = `import { HanjaCharacter } from '../types';

/**
 * CSV에서 생성된 한자 데이터
 * 이 파일은 scripts/generateCharacterData.js에 의해 자동 생성됩니다.
 * CSV 파일을 수정한 후 이 스크립트를 다시 실행하세요.
 */

export const characterData: HanjaCharacter[] = [
`;

  allCharacters.forEach((char, index) => {
    content += `  {
    id: '${char.id}',
    character: '${char.character}',
    pronunciation: '${char.pronunciation}',
    meaning: '${char.meaning}',
    strokeCount: ${char.strokeCount},
    radical: '${char.radical}',
    radicalName: '${char.radicalName}',
    radicalStrokes: ${char.radicalStrokes},
  }${index < allCharacters.length - 1 ? ',' : ''}
`;
  });

  content += `];

// 급수별 한자 개수
export const characterCounts = {
`;

  const counts = {};
  allCharacters.forEach(char => {
    const grade = parseInt(char.id.split('_')[0].replace('grade', ''));
    counts[grade] = (counts[grade] || 0) + 1;
  });

  Object.keys(counts)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .forEach(grade => {
      content += `  ${grade}: ${counts[grade]},
`;
    });

  content += `};

// 총 한자 개수
export const totalCharacterCount = ${allCharacters.length};
`;

  return content;
};

// 메인 실행 함수
const main = () => {
  console.log('🚀 CSV 파일에서 한자 데이터 생성 중...');

  const dataDir = path.join(__dirname, '../src/data');
  const outputPath = path.join(__dirname, '../src/data/characterData.ts');

  const allCharacters = [];

  // 3급부터 8급까지 순서대로 처리
  for (let grade = 3; grade <= 8; grade++) {
    const csvPath = path.join(dataDir, `grade${grade}_characters.csv`);

    if (fs.existsSync(csvPath)) {
      console.log(`📖 ${grade}급 CSV 파일 읽기: ${csvPath}`);
      const characters = parseCSVFile(csvPath, grade);
      allCharacters.push(...characters);
      console.log(`✅ ${grade}급: ${characters.length}개 한자 파싱 완료`);
    } else {
      console.warn(`⚠️ ${grade}급 CSV 파일을 찾을 수 없습니다: ${csvPath}`);
    }
  }

  console.log(`📊 총 ${allCharacters.length}개 한자 파싱 완료`);

  // TypeScript 파일 생성
  const tsContent = generateTypeScriptFile(allCharacters);
  fs.writeFileSync(outputPath, tsContent);

  console.log(`✅ TypeScript 파일 생성 완료: ${outputPath}`);

  // 급수별 통계 출력
  const counts = {};
  allCharacters.forEach(char => {
    const grade = parseInt(char.id.split('_')[0].replace('grade', ''));
    counts[grade] = (counts[grade] || 0) + 1;
  });

  console.log('\n📊 급수별 한자 개수:');
  Object.keys(counts)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .forEach(grade => {
      console.log(`   ${grade}급: ${counts[grade]}개`);
    });

  console.log(`\n🎯 총 한자 개수: ${allCharacters.length}개`);
};

// 스크립트 실행
main();
