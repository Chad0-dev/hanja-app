const fs = require('fs');
const path = require('path');

// characterData와 wordData 로드
const characterDataPath = path.join(__dirname, '../src/data/characterData.ts');
const wordDataPath = path.join(__dirname, '../src/data/wordData.ts');

const loadCharacterData = () => {
  const content = fs.readFileSync(characterDataPath, 'utf8');
  const characterSet = new Set();

  // character: '葛' 패턴으로 모든 한자 추출
  const matches = content.match(/character: '(.)',/g);
  if (matches) {
    matches.forEach(match => {
      const char = match.match(/character: '(.)',/)[1];
      characterSet.add(char);
    });
  }

  return characterSet;
};

const loadWordData = () => {
  const content = fs.readFileSync(wordDataPath, 'utf8');
  const wordChars = new Set();

  // word: '葛藤' 패턴으로 모든 단어 추출
  const wordMatches = content.match(/word: '([^']+)',/g);
  if (wordMatches) {
    wordMatches.forEach(match => {
      const word = match.match(/word: '([^']+)',/)[1];
      // 각 한자를 개별로 추출
      for (const char of word) {
        wordChars.add(char);
      }
    });
  }

  return wordChars;
};

const main = () => {
  console.log('🔍 남은 누락 한자 분석 중...');

  const characterSet = loadCharacterData();
  const wordChars = loadWordData();

  console.log(`📊 characterData에 있는 한자: ${characterSet.size}개`);
  console.log(`📊 wordData에 필요한 한자: ${wordChars.size}개`);

  const missingChars = [];
  for (const char of wordChars) {
    if (!characterSet.has(char)) {
      missingChars.push(char);
    }
  }

  console.log(`❌ 누락된 한자 ${missingChars.length}개:`);
  console.log(missingChars.join(', '));

  // 누락된 한자들을 파일로 저장
  const missingCharsFile = path.join(__dirname, 'remaining_missing_chars.txt');
  fs.writeFileSync(missingCharsFile, missingChars.join('\n'));
  console.log(`📁 누락된 한자 목록 저장: ${missingCharsFile}`);

  return missingChars;
};

const missingChars = main();
