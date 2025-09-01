#!/usr/bin/env node

/**
 * 한자 데이터 자동 임포트 스크립트
 * 엑셀/CSV 파일을 seedData.ts 형식으로 변환
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// CSV 파일 경로
const CHARACTERS_CSV = './data/combined_characters.csv';
const WORDS_CSV = './data/combined_words.csv';
const OUTPUT_FILE = '../src/data/seedData.ts';

/**
 * CSV 파일을 읽어서 JSON으로 변환
 */
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', data => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

/**
 * 한자 캐릭터 데이터를 TypeScript 형식으로 변환
 */
function generateCharacterCode(characters) {
  let code = `// 자동 생성된 한자 캐릭터 데이터
export const seedHanjaCharacters: HanjaCharacter[] = [
`;

  characters.forEach(char => {
    code += `  {
    id: '${char.id}',
    character: '${char.character}',
    pronunciation: '${char.pronunciation}',
    meaning: '${char.meaning}',
    strokeCount: ${char.strokeCount},
    radical: '${char.radical}',
    radicalName: '${char.radicalName}',
    radicalStrokes: ${char.radicalStrokes},
  },
`;
  });

  code += `];

`;
  return code;
}

/**
 * 한자 단어 데이터를 TypeScript 형식으로 변환
 */
function generateWordCode(words) {
  let code = `// 자동 생성된 한자 단어 데이터
export const seedHanjaWordCards: HanjaWordCard[] = [
`;

  words.forEach(word => {
    const characterIds = word.characterIds.split(';');
    const leftSwipeWords = word.leftSwipe ? word.leftSwipe.split(';') : [];
    const rightSwipeWords = word.rightSwipe ? word.rightSwipe.split(';') : [];

    code += `  {
    id: '${word.id}',
    word: '${word.word}',
    pronunciation: '${word.pronunciation}',
    meaning: '${word.meaning}',
    characters: [
      ${characterIds.map(id => `findCharacter('${id}')`).join(',\n      ')}
    ],
    grade: ${word.grade},
    isMemorized: false,
    relatedWords: {
      leftSwipe: [${leftSwipeWords.map(w => `'${w}'`).join(', ')}],
      rightSwipe: [${rightSwipeWords.map(w => `'${w}'`).join(', ')}],
    },
  },
`;
  });

  code += `];
`;
  return code;
}

/**
 * 완전한 seedData.ts 파일 생성
 */
function generateFullSeedData(characters, words) {
  return `import { HanjaCharacter, HanjaWordCard } from '../types';

// 한자 찾기 헬퍼 함수 (에러 방지)
const findCharacter = (id: string): HanjaCharacter => {
  const char = seedHanjaCharacters.find(c => c.id === id);
  if (!char) {
    console.error(\`❌ 한자를 찾을 수 없습니다: \${id}\`);
    // 기본 한자 반환 (에러 방지용)
    return {
      id: id,
      character: '?',
      pronunciation: '?',
      meaning: '알 수 없음',
      strokeCount: 1,
      radical: '?',
      radicalName: '알 수 없음',
      radicalStrokes: 1,
    };
  }
  return char;
};

/**
 * 시드 데이터 - SQLite 데이터베이스 초기화용
 * 이 데이터는 앱 최초 실행시에만 DB에 삽입되고, 이후에는 DB에서 데이터를 조회합니다.
 */

${generateCharacterCode(characters)}
${generateWordCode(words)}
`;
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    console.log('🚀 한자 데이터 임포트 시작...');

    // CSV 파일 존재 확인
    if (!fs.existsSync(CHARACTERS_CSV)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${CHARACTERS_CSV}`);
      console.log('📋 다음 형식으로 characters.csv 파일을 만들어주세요:');
      console.log(
        'id,character,pronunciation,meaning,strokeCount,radical,radicalName,radicalStrokes'
      );
      console.log('one,一,일,하나,1,一,한일,1');
      return;
    }

    if (!fs.existsSync(WORDS_CSV)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${WORDS_CSV}`);
      console.log('📋 다음 형식으로 words.csv 파일을 만들어주세요:');
      console.log(
        'id,word,pronunciation,meaning,characterIds,grade,leftSwipe,rightSwipe'
      );
      console.log(
        'one_two,一二,일이,하나 둘,one;two,8,three_four;nine_ten,three_four;five_six'
      );
      return;
    }

    // CSV 데이터 읽기
    console.log('📖 CSV 파일 읽는 중...');
    const characters = await readCSV(CHARACTERS_CSV);
    const words = await readCSV(WORDS_CSV);

    console.log(`✅ 한자 캐릭터 ${characters.length}개 로드됨`);
    console.log(`✅ 한자 단어 ${words.length}개 로드됨`);

    // TypeScript 코드 생성
    console.log('🔄 TypeScript 코드 생성 중...');
    const seedDataCode = generateFullSeedData(characters, words);

    // 파일 저장
    const outputPath = path.resolve(__dirname, OUTPUT_FILE);
    fs.writeFileSync(outputPath, seedDataCode, 'utf8');

    console.log(`🎉 성공적으로 생성되었습니다: ${outputPath}`);
    console.log(
      `📊 총 ${characters.length}개 한자, ${words.length}개 단어가 등록되었습니다.`
    );
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = {
  readCSV,
  generateCharacterCode,
  generateWordCode,
  generateFullSeedData,
};
