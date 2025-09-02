const fs = require('fs');
const path = require('path');

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
const parseWordCSV = (filePath, grade) => {
  const csvContent = fs.readFileSync(filePath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  const words = lines.map((line, index) => {
    // 탭으로 구분된 데이터 파싱
    const [koreanWord, hanjaWord, meaning] = line.split('\t');
    return {
      grade,
      word: hanjaWord,
      characters: hanjaWord.split(''),
    };
  });

  return words;
};

const main = () => {
  console.log('🔍 누락된 한자 분석 중...');

  // characterData 로드
  const characterMap = loadCharacterData();
  console.log(
    `📖 characterData에서 ${characterMap.size}개 한자 정보 로드 완료`
  );

  const dataDir = path.join(__dirname, '../src/data');
  const missingCharacters = new Set();
  const foundCharacters = new Set();

  // 3급부터 8급까지 순서대로 처리
  for (let grade = 3; grade <= 8; grade++) {
    const csvPath = path.join(dataDir, `grade${grade}_words.csv`);

    if (fs.existsSync(csvPath)) {
      console.log(`📖 ${grade}급 완성 단어 CSV 파일 읽기: ${csvPath}`);
      const words = parseWordCSV(csvPath, grade);

      words.forEach(word => {
        word.characters.forEach(char => {
          if (characterMap.has(char)) {
            foundCharacters.add(char);
          } else {
            missingCharacters.add(char);
          }
        });
      });
    }
  }

  console.log(`\n📊 분석 결과:`);
  console.log(`✅ 찾은 한자: ${foundCharacters.size}개`);
  console.log(`❌ 누락된 한자: ${missingCharacters.size}개`);

  if (missingCharacters.size > 0) {
    console.log(`\n❌ 누락된 한자 목록:`);
    const missingArray = Array.from(missingCharacters).sort();
    missingArray.forEach((char, index) => {
      console.log(`${(index + 1).toString().padStart(3, ' ')}. ${char}`);
    });

    // 특수 문자 분석
    const specialChars = missingArray.filter(char => {
      const code = char.charCodeAt(0);
      return code >= 0xf900 && code <= 0xfaff; // CJK Compatibility Ideographs
    });

    if (specialChars.length > 0) {
      console.log(
        `\n🔍 특수 문자 (CJK Compatibility): ${specialChars.length}개`
      );
      specialChars.forEach(char => {
        console.log(
          `   ${char} (U+${char.charCodeAt(0).toString(16).toUpperCase()})`
        );
      });
    }
  }

  // characterData.ts에 있는 한자 중에서 단어에서 사용되지 않는 한자들
  const unusedCharacters = new Set();
  characterMap.forEach((charInfo, char) => {
    if (!foundCharacters.has(char)) {
      unusedCharacters.add(char);
    }
  });

  console.log(`\n📊 사용되지 않는 한자: ${unusedCharacters.size}개`);
  if (unusedCharacters.size > 0) {
    const unusedArray = Array.from(unusedCharacters).sort();
    console.log(`\n🔍 사용되지 않는 한자 목록 (처음 20개):`);
    unusedArray.slice(0, 20).forEach((char, index) => {
      console.log(`${(index + 1).toString().padStart(3, ' ')}. ${char}`);
    });
    if (unusedArray.length > 20) {
      console.log(`   ... 그리고 ${unusedArray.length - 20}개 더`);
    }
  }
};

main();
