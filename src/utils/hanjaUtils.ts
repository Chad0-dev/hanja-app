import Hangul from "hangul-js";
import { HanjaCharacter, SearchFilter } from "../types";

/**
 * 한자를 한글로 변환하는 함수
 */
export const convertHanjaToHangul = (hanja: string): string => {
  // hangul-js 라이브러리를 사용하여 한자를 한글로 변환
  return Hangul.disassemble(hanja).join("");
};

/**
 * 검색 필터에 따라 한자 데이터를 필터링하는 함수
 */
export const filterHanjaCharacters = (
  characters: HanjaCharacter[],
  filter: SearchFilter,
  searchTerm: string = ""
): HanjaCharacter[] => {
  return characters.filter((char) => {
    // 급수 필터
    if (filter.level && filter.level.length > 0) {
      if (!filter.level.includes(char.level)) {
        return false;
      }
    }

    // 획수 필터
    if (filter.strokeCount) {
      const { min, max } = filter.strokeCount;
      if (char.strokeCount < min || char.strokeCount > max) {
        return false;
      }
    }

    // 검색어 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase();

      switch (filter.searchType) {
        case "character":
          return char.character.includes(searchTerm);
        case "pronunciation":
          return char.pronunciation.toLowerCase().includes(term);
        case "meaning":
          return char.meaning.toLowerCase().includes(term);
        default:
          return (
            char.character.includes(searchTerm) ||
            char.pronunciation.toLowerCase().includes(term) ||
            char.meaning.toLowerCase().includes(term)
          );
      }
    }

    return true;
  });
};

/**
 * 한자 급수에 따른 색상 반환
 */
export const getLevelColor = (level: number): string => {
  const colors = {
    1: "#FF6B6B", // 빨간색 (가장 어려움)
    2: "#FF8E53",
    3: "#FF922B",
    4: "#FD7E14",
    5: "#FAB005",
    6: "#40C057",
    7: "#51CF66",
    8: "#69DB7C", // 초록색 (가장 쉬움)
  };

  return colors[level as keyof typeof colors] || "#868E96";
};

/**
 * 학습 진도에 따른 상태 텍스트 반환
 */
export const getProgressStatusText = (
  correctCount: number,
  wrongCount: number
): string => {
  const total = correctCount + wrongCount;

  if (total === 0) return "미학습";

  const accuracy = (correctCount / total) * 100;

  if (accuracy >= 90) return "완벽";
  if (accuracy >= 70) return "우수";
  if (accuracy >= 50) return "보통";
  return "부족";
};

/**
 * 획수에 따른 난이도 레벨 반환
 */
export const getStrokeDifficulty = (
  strokeCount: number
): "easy" | "medium" | "hard" => {
  if (strokeCount <= 8) return "easy";
  if (strokeCount <= 15) return "medium";
  return "hard";
};

/**
 * 랜덤한 한자 선택 (복습용)
 */
export const selectRandomHanja = (
  characters: HanjaCharacter[],
  excludeIds: string[] = [],
  count: number = 1
): HanjaCharacter[] => {
  const available = characters.filter((char) => !excludeIds.includes(char.id));
  const shuffled = [...available].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

/**
 * 한자 데이터 유효성 검사
 */
export const validateHanjaCharacter = (
  char: Partial<HanjaCharacter>
): boolean => {
  return !!(
    char.id &&
    char.character &&
    char.pronunciation &&
    char.meaning &&
    typeof char.level === "number" &&
    char.level >= 1 &&
    char.level <= 8 &&
    typeof char.strokeCount === "number" &&
    char.strokeCount > 0
  );
};
