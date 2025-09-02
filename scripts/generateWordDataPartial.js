const fs = require('fs');
const path = require('path');

// meaning 필드를 단순한 문자열로 변환하는 함수
const parseMeaning = meaningStr => {
  try {
    // 복잡한 배열 형식인 경우 첫 번째 의미만 추출
    if (meaningStr.includes('[[') && meaningStr.includes(']]')) {
      // 첫 번째 작은따옴표와 두 번째 작은따옴표 사이의 내용 추출
      const firstQuoteIndex = meaningStr.indexOf("'");
      const secondQuoteIndex = meaningStr.indexOf("'", firstQuoteIndex + 1);

      if (firstQuoteIndex !== -1 && secondQuoteIndex !== -1) {
        const extracted = meaningStr.substring(
          firstQuoteIndex + 1,
          secondQuoteIndex
        );
        // 이스케이프된 작은따옴표를 일반 작은따옴표로 변환
        return extracted.replace(/\\'/g, "'");
      }
    }
    return meaningStr;
  } catch (error) {
    console.warn('meaning 파싱 실패:', meaningStr, error);
    return meaningStr;
  }
};

// characterData.ts에서 한자 정보를 로드하는 함수
const loadCharacterData = () => {
  const characterDataPath = path.join(
    __dirname,
    '../src/data/characterData.ts'
  );
  const content = fs.readFileSync(characterDataPath, 'utf8');

  // characterData 배열 추출
  const arrayStart = content.indexOf(
    'export const characterData: HanjaCharacter[] = ['
  );
  const arrayEnd = content.indexOf('];', arrayStart) + 2;
  const arrayContent = content.substring(arrayStart, arrayEnd);

  // 한자 정보를 파싱하여 Map으로 저장
  const characterMap = new Map();

  // 더 유연한 정규표현식으로 한자 정보 추출
  const charRegex =
    /{\s*id:\s*'([^']+)',\s*character:\s*'([^']+)',\s*pronunciation:\s*'([^']*)',\s*meaning:\s*'([^']*(?:\\'[^']*)*)',\s*strokeCount:\s*(\d+),\s*radical:\s*'([^']*)',\s*radicalName:\s*'([^']*)',\s*radicalStrokes:\s*(\d+),/g;

  let match;
  while ((match = charRegex.exec(arrayContent)) !== null) {
    const [
      ,
      id,
      character,
      pronunciation,
      meaning,
      strokeCount,
      radical,
      radicalName,
      radicalStrokes,
    ] = match;

    characterMap.set(character, {
      id,
      character,
      pronunciation,
      meaning,
      strokeCount: parseInt(strokeCount),
      radical,
      radicalName,
      radicalStrokes: parseInt(radicalStrokes),
    });
  }

  return characterMap;
};

// CSV 파일에서 단어 데이터를 파싱하는 함수
const parseWordCSV = (filePath, grade, characterMap) => {
  const csvContent = fs.readFileSync(filePath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  const words = lines.map((line, index) => {
    // 탭으로 구분된 데이터 파싱
    const [koreanWord, hanjaWord, meaning] = line.split('\t');

    // 한자 단어에서 개별 한자 추출하고 characterData에서 정보 매칭
    const characters = hanjaWord
      .split('')
      .map((char, charIndex) => {
        const charInfo = characterMap.get(char);
        if (charInfo) {
          return {
            id: charInfo.id, // characterData에서 가져온 정확한 ID 사용
            character: charInfo.character,
            pronunciation: charInfo.pronunciation,
            meaning: parseMeaning(charInfo.meaning),
            strokeCount: charInfo.strokeCount,
            radical: charInfo.radical,
            radicalName: charInfo.radicalName,
            radicalStrokes: charInfo.radicalStrokes,
          };
        } else {
          // 누락된 한자는 빈 정보로 표시하지 않고 건너뛰기
          return null;
        }
      })
      .filter(char => char !== null); // null 값 제거

    return {
      id: `grade${grade}_word_${(index + 1).toString().padStart(3, '0')}`,
      word: hanjaWord,
      pronunciation: koreanWord.replace(/'/g, "\\'"),
      meaning: meaning.replace(/'/g, "\\'"),
      characters: characters,
      grade: grade,
      isMemorized: false,
      relatedWords: {
        leftSwipe: [],
        rightSwipe: [],
      },
    };
  });

  return words;
};

// TypeScript 파일을 생성하는 함수
const generateTypeScriptFile = allWords => {
  let content = `import { HanjaWordCard } from '../types';

/**
 * CSV에서 생성된 완성 단어 데이터 (부분 매칭)
 * 이 파일은 scripts/generateWordDataPartial.js에 의해 자동 생성됩니다.
 * CSV 파일을 수정한 후 이 스크립트를 다시 실행하세요.
 */

export const wordData: HanjaWordCard[] = [
`;

  allWords.forEach(word => {
    content += `  {
    id: '${word.id}',
    word: '${word.word}',
    pronunciation: '${word.pronunciation}',
    meaning: '${word.meaning}',
    characters: [
`;

    word.characters.forEach((char, charIndex) => {
      content += `      {
        id: '${char.id}',
        character: '${char.character}',
        pronunciation: '${char.pronunciation}',
        meaning: ${JSON.stringify(char.meaning)},
        strokeCount: ${char.strokeCount},
        radical: '${char.radical}',
        radicalName: '${char.radicalName}',
        radicalStrokes: ${char.radicalStrokes},
      },\n`;
    });

    content += `    ],
    grade: ${word.grade},
    isMemorized: ${word.isMemorized},
    relatedWords: {
      leftSwipe: ${JSON.stringify(word.relatedWords.leftSwipe)},
      rightSwipe: ${JSON.stringify(word.relatedWords.rightSwipe)},
    },
  },
`;
  });

  content += `];

export const wordCountsByGrade = {
`;

  const counts = {};
  allWords.forEach(word => {
    counts[word.grade] = (counts[word.grade] || 0) + 1;
  });

  Object.keys(counts)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .forEach(grade => {
      content += `  grade${grade}: ${counts[grade]},\n`;
    });

  content += `};
`;

  return content;
};

const main = () => {
  console.log('🚀 부분 매칭 방식으로 완성 단어 데이터 생성 중...');

  // characterData 로드
  const characterMap = loadCharacterData();
  console.log(
    `📖 characterData에서 ${characterMap.size}개 한자 정보 로드 완료`
  );

  const dataDir = path.join(__dirname, '../src/data');
  const outputPath = path.join(__dirname, '../src/data/wordData.ts');

  const allWords = [];
  let totalMissingChars = 0;
  let totalFoundChars = 0;

  // 3급부터 8급까지 순서대로 처리
  for (let grade = 3; grade <= 8; grade++) {
    const csvPath = path.join(dataDir, `grade${grade}_words.csv`);

    if (fs.existsSync(csvPath)) {
      console.log(`📖 ${grade}급 완성 단어 CSV 파일 읽기: ${csvPath}`);
      const words = parseWordCSV(csvPath, grade, characterMap);

      // 통계 계산
      words.forEach(word => {
        const originalChars = word.word.split('');
        const foundChars = word.characters.length;
        totalFoundChars += foundChars;
        totalMissingChars += originalChars.length - foundChars;
      });

      allWords.push(...words);
      console.log(`✅ ${grade}급 완성 단어 ${words.length}개 파싱 완료`);
    }
  }

  console.log(`📊 총 ${allWords.length}개 완성 단어 파싱 완료`);
  console.log(`📊 한자 매칭 통계:`);
  console.log(`   ✅ 찾은 한자: ${totalFoundChars}개`);
  console.log(`   ❌ 누락된 한자: ${totalMissingChars}개`);
  console.log(
    `   📈 매칭률: ${((totalFoundChars / (totalFoundChars + totalMissingChars)) * 100).toFixed(1)}%`
  );

  // TypeScript 파일 생성
  const tsContent = generateTypeScriptFile(allWords);
  fs.writeFileSync(outputPath, tsContent);

  console.log(`✅ TypeScript 파일 생성 완료: ${outputPath}`);

  // 급수별 통계 출력
  const counts = {};
  allWords.forEach(word => {
    counts[word.grade] = (counts[word.grade] || 0) + 1;
  });

  console.log('\n📊 급수별 완성 단어 개수:');
  Object.keys(counts)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .forEach(grade => {
      console.log(`   ${grade}급: ${counts[grade]}개`);
    });

  console.log(`\n🎯 총 완성 단어 개수: ${allWords.length}개`);
};

main();
