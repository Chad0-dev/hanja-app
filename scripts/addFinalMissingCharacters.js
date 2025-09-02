const fs = require('fs');
const path = require('path');

// 누락된 53개 한자와 실제 정보
const finalMissingChars = [
  {
    char: '主',
    pronunciation: '주',
    meaning: '주인',
    strokeCount: 5,
    radical: '丶',
    radicalName: '丶부',
    radicalStrokes: 1,
  },
  {
    char: '乾',
    pronunciation: '건',
    meaning: '마를',
    strokeCount: 11,
    radical: '乙',
    radicalName: '乙부',
    radicalStrokes: 1,
  },
  {
    char: '使',
    pronunciation: '사',
    meaning: '부릴',
    strokeCount: 8,
    radical: '人',
    radicalName: '人부',
    radicalStrokes: 2,
  },
  {
    char: '便',
    pronunciation: '편',
    meaning: '편할',
    strokeCount: 9,
    radical: '人',
    radicalName: '人부',
    radicalStrokes: 2,
  },
  {
    char: '別',
    pronunciation: '별',
    meaning: '다를',
    strokeCount: 7,
    radical: '刀',
    radicalName: '刀부',
    radicalStrokes: 2,
  },
  {
    char: '區',
    pronunciation: '구',
    meaning: '구역',
    strokeCount: 11,
    radical: '匸',
    radicalName: '匸부',
    radicalStrokes: 2,
  },
  {
    char: '占',
    pronunciation: '점',
    meaning: '점칠',
    strokeCount: 5,
    radical: '卜',
    radicalName: '卜부',
    radicalStrokes: 2,
  },
  {
    char: '反',
    pronunciation: '반',
    meaning: '돌이킬',
    strokeCount: 4,
    radical: '又',
    radicalName: '又부',
    radicalStrokes: 2,
  },
  {
    char: '右',
    pronunciation: '우',
    meaning: '오른쪽',
    strokeCount: 5,
    radical: '口',
    radicalName: '口부',
    radicalStrokes: 3,
  },
  {
    char: '報',
    pronunciation: '보',
    meaning: '알릴',
    strokeCount: 12,
    radical: '土',
    radicalName: '土부',
    radicalStrokes: 3,
  },
  {
    char: '布',
    pronunciation: '포',
    meaning: '베',
    strokeCount: 5,
    radical: '巾',
    radicalName: '巾부',
    radicalStrokes: 3,
  },
  {
    char: '度',
    pronunciation: '도',
    meaning: '법도',
    strokeCount: 9,
    radical: '广',
    radicalName: '广부',
    radicalStrokes: 3,
  },
  {
    char: '廢',
    pronunciation: '폐',
    meaning: '폐할',
    strokeCount: 15,
    radical: '广',
    radicalName: '广부',
    radicalStrokes: 3,
  },
  {
    char: '弊',
    pronunciation: '폐',
    meaning: '해로울',
    strokeCount: 15,
    radical: '廾',
    radicalName: '廾부',
    radicalStrokes: 3,
  },
  {
    char: '徑',
    pronunciation: '경',
    meaning: '지름길',
    strokeCount: 10,
    radical: '彳',
    radicalName: '彳부',
    radicalStrokes: 3,
  },
  {
    char: '惡',
    pronunciation: '악',
    meaning: '악할',
    strokeCount: 12,
    radical: '心',
    radicalName: '心부',
    radicalStrokes: 4,
  },
  {
    char: '攝',
    pronunciation: '섭',
    meaning: '거둘',
    strokeCount: 21,
    radical: '手',
    radicalName: '手부',
    radicalStrokes: 4,
  },
  {
    char: '智',
    pronunciation: '지',
    meaning: '지혜',
    strokeCount: 12,
    radical: '日',
    radicalName: '日부',
    radicalStrokes: 4,
  },
  {
    char: '暇',
    pronunciation: '가',
    meaning: '겨를',
    strokeCount: 13,
    radical: '日',
    radicalName: '日부',
    radicalStrokes: 4,
  },
  {
    char: '梁',
    pronunciation: '량',
    meaning: '들보',
    strokeCount: 11,
    radical: '木',
    radicalName: '木부',
    radicalStrokes: 4,
  },
  {
    char: '極',
    pronunciation: '극',
    meaning: '극진할',
    strokeCount: 12,
    radical: '木',
    radicalName: '木부',
    radicalStrokes: 4,
  },
  {
    char: '洞',
    pronunciation: '동',
    meaning: '구멍',
    strokeCount: 9,
    radical: '水',
    radicalName: '水부',
    radicalStrokes: 4,
  },
  {
    char: '滅',
    pronunciation: '멸',
    meaning: '멸할',
    strokeCount: 13,
    radical: '水',
    radicalName: '水부',
    radicalStrokes: 4,
  },
  {
    char: '狀',
    pronunciation: '상',
    meaning: '모양',
    strokeCount: 7,
    radical: '犬',
    radicalName: '犬부',
    radicalStrokes: 4,
  },
  {
    char: '省',
    pronunciation: '성',
    meaning: '살필',
    strokeCount: 9,
    radical: '目',
    radicalName: '目부',
    radicalStrokes: 5,
  },
  {
    char: '程',
    pronunciation: '정',
    meaning: '법도',
    strokeCount: 12,
    radical: '禾',
    radicalName: '禾부',
    radicalStrokes: 5,
  },
  {
    char: '稿',
    pronunciation: '고',
    meaning: '초고',
    strokeCount: 15,
    radical: '禾',
    radicalName: '禾부',
    radicalStrokes: 5,
  },
  {
    char: '簡',
    pronunciation: '간',
    meaning: '간략할',
    strokeCount: 18,
    radical: '竹',
    radicalName: '竹부',
    radicalStrokes: 6,
  },
  {
    char: '素',
    pronunciation: '소',
    meaning: '본디',
    strokeCount: 10,
    radical: '糸',
    radicalName: '糸부',
    radicalStrokes: 6,
  },
  {
    char: '絡',
    pronunciation: '락',
    meaning: '얽을',
    strokeCount: 12,
    radical: '糸',
    radicalName: '糸부',
    radicalStrokes: 6,
  },
  {
    char: '經',
    pronunciation: '경',
    meaning: '지날',
    strokeCount: 11,
    radical: '糸',
    radicalName: '糸부',
    radicalStrokes: 6,
  },
  {
    char: '肖',
    pronunciation: '초',
    meaning: '닮을',
    strokeCount: 7,
    radical: '肉',
    radicalName: '肉부',
    radicalStrokes: 6,
  },
  {
    char: '與',
    pronunciation: '여',
    meaning: '더불어',
    strokeCount: 13,
    radical: '臼',
    radicalName: '臼부',
    radicalStrokes: 6,
  },
  {
    char: '行',
    pronunciation: '행',
    meaning: '다닐',
    strokeCount: 6,
    radical: '行',
    radicalName: '行부',
    radicalStrokes: 6,
  },
  {
    char: '覆',
    pronunciation: '복',
    meaning: '덮을',
    strokeCount: 18,
    radical: '西',
    radicalName: '西부',
    radicalStrokes: 6,
  },
  {
    char: '見',
    pronunciation: '견',
    meaning: '볼',
    strokeCount: 7,
    radical: '見',
    radicalName: '見부',
    radicalStrokes: 7,
  },
  {
    char: '詞',
    pronunciation: '사',
    meaning: '말',
    strokeCount: 12,
    radical: '言',
    radicalName: '言부',
    radicalStrokes: 7,
  },
  {
    char: '誕',
    pronunciation: '탄',
    meaning: '낳을',
    strokeCount: 14,
    radical: '言',
    radicalName: '言부',
    radicalStrokes: 7,
  },
  {
    char: '說',
    pronunciation: '설',
    meaning: '말할',
    strokeCount: 14,
    radical: '言',
    radicalName: '言부',
    radicalStrokes: 7,
  },
  {
    char: '譽',
    pronunciation: '예',
    meaning: '기릴',
    strokeCount: 21,
    radical: '言',
    radicalName: '言부',
    radicalStrokes: 7,
  },
  {
    char: '赴',
    pronunciation: '부',
    meaning: '달려갈',
    strokeCount: 9,
    radical: '走',
    radicalName: '走부',
    radicalStrokes: 7,
  },
  {
    char: '較',
    pronunciation: '교',
    meaning: '비교할',
    strokeCount: 13,
    radical: '車',
    radicalName: '車부',
    radicalStrokes: 7,
  },
  {
    char: '追',
    pronunciation: '추',
    meaning: '쫓을',
    strokeCount: 9,
    radical: '辵',
    radicalName: '辵부',
    radicalStrokes: 7,
  },
  {
    char: '遲',
    pronunciation: '지',
    meaning: '늦을',
    strokeCount: 15,
    radical: '辵',
    radicalName: '辵부',
    radicalStrokes: 7,
  },
  {
    char: '郭',
    pronunciation: '곽',
    meaning: '성곽',
    strokeCount: 11,
    radical: '邑',
    radicalName: '邑부',
    radicalStrokes: 7,
  },
  {
    char: '酌',
    pronunciation: '작',
    meaning: '술따를',
    strokeCount: 10,
    radical: '酉',
    radicalName: '酉부',
    radicalStrokes: 7,
  },
  {
    char: '配',
    pronunciation: '배',
    meaning: '배필',
    strokeCount: 10,
    radical: '酉',
    radicalName: '酉부',
    radicalStrokes: 7,
  },
  {
    char: '鍊',
    pronunciation: '련',
    meaning: '단련할',
    strokeCount: 16,
    radical: '金',
    radicalName: '金부',
    radicalStrokes: 8,
  },
  {
    char: '降',
    pronunciation: '강',
    meaning: '내릴',
    strokeCount: 8,
    radical: '阜',
    radicalName: '阜부',
    radicalStrokes: 3,
  },
  {
    char: '零',
    pronunciation: '령',
    meaning: '떨어질',
    strokeCount: 13,
    radical: '雨',
    radicalName: '雨부',
    radicalStrokes: 8,
  },
  {
    char: '需',
    pronunciation: '수',
    meaning: '쓸',
    strokeCount: 14,
    radical: '雨',
    radicalName: '雨부',
    radicalStrokes: 8,
  },
  {
    char: '頃',
    pronunciation: '경',
    meaning: '잠깐',
    strokeCount: 11,
    radical: '頁',
    radicalName: '頁부',
    radicalStrokes: 9,
  },
  {
    char: '率',
    pronunciation: '솔',
    meaning: '솔선할',
    strokeCount: 11,
    radical: '玄',
    radicalName: '玄부',
    radicalStrokes: 5,
  },
];

const addFinalMissingCharacters = () => {
  const characterDataPath = path.join(
    __dirname,
    '../src/data/characterData.ts'
  );
  let content = fs.readFileSync(characterDataPath, 'utf8');

  // 배열의 끝을 찾음
  const arrayEndIndex = content.lastIndexOf('];');
  if (arrayEndIndex === -1) {
    throw new Error('characterData 배열을 찾을 수 없습니다.');
  }

  // 새로운 한자 데이터 생성
  let newCharacterCode = '';
  finalMissingChars.forEach((charInfo, index) => {
    const charId = `final_missing_${(index + 1).toString().padStart(3, '0')}`;
    newCharacterCode += `  {\n`;
    newCharacterCode += `    id: '${charId}',\n`;
    newCharacterCode += `    character: '${charInfo.char}',\n`;
    newCharacterCode += `    pronunciation: '${charInfo.pronunciation}',\n`;
    newCharacterCode += `    meaning: '${charInfo.meaning}',\n`;
    newCharacterCode += `    strokeCount: ${charInfo.strokeCount},\n`;
    newCharacterCode += `    radical: '${charInfo.radical}',\n`;
    newCharacterCode += `    radicalName: '${charInfo.radicalName}',\n`;
    newCharacterCode += `    radicalStrokes: ${charInfo.radicalStrokes},\n`;
    newCharacterCode += `  },\n`;
  });

  // 새 내용으로 업데이트
  const newContent =
    content.substring(0, arrayEndIndex) +
    newCharacterCode +
    content.substring(arrayEndIndex);

  // 백업 생성
  const backupPath = characterDataPath + '.backup3';
  fs.copyFileSync(characterDataPath, backupPath);
  console.log(`📁 백업 생성: ${backupPath}`);

  // 업데이트된 파일 저장
  fs.writeFileSync(characterDataPath, newContent);
  console.log(`✅ ${finalMissingChars.length}개 최종 누락 한자 추가 완료`);

  // 추가된 한자 목록 출력
  console.log(`📝 추가된 한자들:`);
  finalMissingChars.forEach((charInfo, index) => {
    console.log(
      `   ${index + 1}. ${charInfo.char}(${charInfo.pronunciation}) - ${charInfo.meaning}`
    );
  });
};

const main = () => {
  console.log('🔧 최종 누락 한자 53개 추가 중...');

  try {
    addFinalMissingCharacters();
    console.log('🎯 최종 누락 한자 추가 완료!');
    console.log(
      '📝 다음 단계: scripts/generateWordDataPartial.js 실행하여 wordData.ts 재생성'
    );
    console.log(
      '📝 그 다음: hanjaDebug.appReset() 실행하여 데이터베이스 재초기화'
    );
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
};

main();
