// Google AdMob 관련 컴포넌트 및 설정
// export { AdBanner } from './AdBanner'; // 네이티브 모듈 에러로 인해 주석 처리
export { AdBannerSafe } from './AdBannerSafe';
// export { AdMobConfig, AdUnitIds, getAdUnitId } from './AdMobConfig'; // 네이티브 모듈 에러로 인해 주석 처리

// 임시로 AdUnitIds와 getAdUnitId만 별도 구현
export const AdUnitIds = {
  ios: {
    banner: __DEV__
      ? 'ca-app-pub-3940256099942544/2934735716'
      : 'ca-app-pub-3195009493032065/9542885198',
  },
  android: {
    banner: __DEV__
      ? 'ca-app-pub-3940256099942544/6300978111'
      : 'YOUR_ANDROID_BANNER_AD_UNIT_ID',
  },
} as const;

export const getAdUnitId = (adType: 'banner'): string => {
  const platform = require('react-native').Platform.OS as 'ios' | 'android';
  return AdUnitIds[platform][adType];
};
