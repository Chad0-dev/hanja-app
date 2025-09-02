/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// 기존 Expo 기본 색상 (하위 호환성)
const tintColorLight = '#8b7355'; // 앱 테마에 맞게 갈색으로 변경
const tintColorDark = '#f8f6f2'; // 앱 테마에 맞게 오프화이트로 변경

export const Colors = {
  light: {
    text: '#2c1810', // 먹색
    background: '#f8f6f2', // 오프화이트
    tint: tintColorLight,
    icon: '#5a4f3a', // 연한 먹색
    tabIconDefault: '#5a4f3a',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#f8f6f2', // 오프화이트
    background: '#2c1810', // 먹색
    tint: tintColorDark,
    icon: '#a68b6b', // 연한 갈색
    tabIconDefault: '#a68b6b',
    tabIconSelected: tintColorDark,
  },
};

// 새로운 앱 전용 색상 팔레트
export { AppColorCombinations, AppColors } from './AppColors';
