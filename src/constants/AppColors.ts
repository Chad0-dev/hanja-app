/**
 * 앱 전체에서 사용할 통일된 색상 팔레트
 * 오프화이트/먹색 톤앤톤 컨셉
 */

export const AppColors = {
  // 메인 색상 (오프화이트 계열)
  primary: '#f8f6f2', // 메인 배경 (한지색)
  primaryLight: '#faf9f7', // 연한 오프화이트
  primaryDark: '#f0ede8', // 진한 오프화이트

  // 먹색 계열 (텍스트/강조)
  ink: '#2c1810', // 먹색 (메인 텍스트)
  inkLight: '#5a4f3a', // 연한 먹색 (서브 텍스트)
  inkMedium: '#3d2f1f', // 중간 먹색

  // 갈색 계열 (보조 색상)
  brown: '#8b7355', // 갈색 (테두리, 버튼)
  brownLight: '#a68b6b', // 연한 갈색
  brownDark: '#6d5a42', // 진한 갈색

  // 베이지 계열 (테두리, 구분선)
  beige: '#d4d0c7', // 베이지 (테두리)
  beigeLight: '#e8e6e3', // 연한 베이지
  beigeDark: '#c4bfb5', // 진한 베이지

  // 시스템 색상
  background: 'rgba(0, 0, 0, 0.6)', // 모달 배경
  shadow: '#2c1810', // 그림자 (먹색)
  white: '#ffffff', // 순백색

  // 상태별 색상 (필요시 사용)
  success: '#6d8b5a', // 성공 (자연스러운 초록)
  warning: '#b8956b', // 경고 (자연스러운 주황)
  error: '#a66b5a', // 오류 (자연스러운 빨강)
  info: '#6b7a8b', // 정보 (자연스러운 파랑)
} as const;

/**
 * 컴포넌트별 색상 조합 (자주 사용되는 조합들)
 */
export const AppColorCombinations = {
  // 카드 스타일
  card: {
    background: AppColors.primary,
    border: AppColors.beige,
    text: AppColors.ink,
    subText: AppColors.inkLight,
  },

  // 버튼 스타일
  primaryButton: {
    background: AppColors.brown,
    text: AppColors.primary,
    border: AppColors.brownDark,
  },

  secondaryButton: {
    background: AppColors.primaryLight,
    text: AppColors.inkLight,
    border: AppColors.beige,
  },

  // 입력 필드
  input: {
    background: AppColors.primaryLight,
    border: AppColors.beige,
    text: AppColors.ink,
    placeholder: AppColors.inkLight,
  },

  // 선택된 상태
  selected: {
    background: AppColors.beigeLight,
    border: AppColors.brown,
    text: AppColors.ink,
  },

  // 안내/정보 박스
  infoBox: {
    background: AppColors.primaryDark,
    border: AppColors.beige,
    text: AppColors.inkLight,
  },
} as const;

export type AppColorKey = keyof typeof AppColors;
export type AppColorCombinationKey = keyof typeof AppColorCombinations;
