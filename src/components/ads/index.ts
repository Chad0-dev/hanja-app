import { Platform } from 'react-native';

// Google AdMob 관련 컴포넌트 및 설정
export { AdBannerSafe } from './AdBannerSafe';

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
  const platform = Platform.OS as 'ios' | 'android';
  return AdUnitIds[platform][adType];
};

// 전면 광고 관련 exports
export {
  loadInterstitialAd,
  showInterstitialAd,
  useInterstitialAd,
} from './InterstitialAd';
