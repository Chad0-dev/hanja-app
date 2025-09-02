# 한자 앱 데이터 관리 스크립트

## 📋 개요

한자 학습 앱의 데이터 관리를 위한 Node.js 스크립트 모음입니다.
CSV 파일에서 TypeScript 데이터 파일을 생성하고 데이터 무결성을 관리합니다.

## 🗂️ 현재 스크립트

### 📊 데이터 생성 스크립트

- **`generateCharacterData.js`**: 급수별 한자 CSV → `characterData.ts` 생성
- **`generateWordDataPartial.js`**: 단어 CSV + 한자 데이터 매칭 → `wordData.ts` 생성

### 🔧 유틸리티 스크립트

- **`analyzeMissingCharacters.js`**: 누락된 한자 분석 및 통계
- **`addFinalMissingCharacters.js`**: 최종 누락 한자 추가
- **`updateCharacterInfo.js`**: 한자 정보 업데이트
- **`findRemainingMissingCharacters.js`**: 남은 누락 한자 검색

### 🗄️ 데이터 파일

- **`data/characters.csv`**: 기본 한자 데이터 (참고용)
- **`data/words.csv`**: 기본 단어 데이터 (참고용)

## 🚀 사용법

### 기본 데이터 생성 워크플로우

```bash
# 1. 한자 데이터 생성
node scripts/generateCharacterData.js

# 2. 단어 데이터 생성 (한자 데이터 생성 후 실행)
node scripts/generateWordDataPartial.js

# 3. 앱에서 데이터 재초기화
# 개발자 콘솔에서: hanjaDebug.appReset()
```

### 데이터 분석 및 디버깅

```bash
# 누락된 한자 분석
node scripts/analyzeMissingCharacters.js

# 남은 누락 한자 찾기
node scripts/findRemainingMissingCharacters.js
```

## 📁 데이터 소스

### 입력 파일 (../src/data/)

- `grade[3-8]_characters.csv`: 급수별 한자 데이터
- `grade[3-8]_words.csv`: 급수별 완성 단어 데이터

### 출력 파일 (../src/data/)

- `characterData.ts`: 모든 한자 데이터 (TypeScript)
- `wordData.ts`: 모든 완성 단어 데이터 (TypeScript)

## 🔄 데이터 흐름

```
CSV 파일들 → generateCharacterData.js → characterData.ts
     ↓
단어 CSV들 → generateWordDataPartial.js → wordData.ts
     ↓
앱 로드 → SQLite 데이터베이스 저장
```

## ✅ 현재 상태

- **한자 데이터**: 1948개 (완료)
- **완성 단어**: 789개 (완료)
- **매칭률**: 99.8% (완료)
- **데이터베이스**: CSV 기반 시스템으로 완전 전환

## 📝 참고사항

- 모든 스크립트는 프로젝트 루트에서 실행해야 합니다
- 데이터 변경 후 반드시 앱에서 `hanjaDebug.appReset()` 실행
- 백업 파일들은 자동으로 생성됩니다
