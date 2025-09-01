# 한자 데이터 임포트 시스템

## 📋 개요

정확한 한자 데이터를 CSV 형태로 받아서 TypeScript 코드로 변환하는 자동화 시스템입니다.

## 🗂️ 파일 구조

```
scripts/
├── importHanjaData.js     # 메인 임포트 스크립트
├── package.json           # 의존성 관리
├── README.md             # 이 파일
└── data/                 # CSV 데이터 파일들
    ├── characters.csv    # 한자 캐릭터 데이터
    └── words.csv         # 한자 단어 데이터
```

## 📝 CSV 파일 형식

### characters.csv

```csv
id,character,pronunciation,meaning,strokeCount,radical,radicalName,radicalStrokes
example,例,예,예시,8,人,사람인,2
```

### words.csv

```csv
id,word,pronunciation,meaning,characterIds,grade,leftSwipe,rightSwipe
example_word,例示,예시,예를 들어 보임,example;show,8,word1;word2,word3;word4
```

## 🚀 사용법

1. **정확한 한자 데이터를 준비**합니다
2. **CSV 파일**을 `data/` 폴더에 배치합니다
3. **임포트 실행**:
   ```bash
   npm run import
   ```

## ⚠️ 주의사항

- **정확성이 최우선**입니다
- 모든 한자 데이터는 **신뢰할 수 있는 출처**에서 가져와야 합니다
- CSV 형식을 **정확히** 맞춰주세요

## 🔄 현재 상태

- 데이터베이스: **초기화됨** (깨끗한 상태)
- seedData.ts: **기본 예시 데이터만** 포함
- 정확한 데이터 임포트 **대기 중**

## 📞 문의

정확한 한자 데이터를 준비해주시면 언제든 임포트할 수 있습니다!
