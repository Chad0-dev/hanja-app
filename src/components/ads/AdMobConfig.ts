import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

/**
 * Google AdMob 설정 및 초기화
 */
export class AdMobConfig {
  private static isInitialized = false;

  /**
   * AdMob 초기화
   * 앱 시작 시 한 번만 호출해야 함
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('📱 AdMob이 이미 초기화되었습니다.');
      return;
    }

    try {
      // AdMob 초기화
      await mobileAds().initialize();

      // 광고 설정
      await mobileAds().setRequestConfiguration({
        // 최대 광고 콘텐츠 등급 (모든 연령대 적합)
        maxAdContentRating: MaxAdContentRating.G,

        // 아동 대상 처리 (한자 학습 앱이므로 아동도 사용 가능)
        tagForChildDirectedTreatment: false,

        // 미성년자 대상 처리
        tagForUnderAgeOfConsent: false,

        // 테스트 기기 ID (개발 중에만 사용)
        testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
      });

      this.isInitialized = true;
      console.log('✅ AdMob 초기화 완료');

      // 초기화 상태 확인
      const adapterStatus = await mobileAds().getInitializationStatus();
      console.log('📊 AdMob 어댑터 상태:', adapterStatus);
    } catch (error) {
      console.error('❌ AdMob 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 초기화 상태 확인
   */
  static isAdMobInitialized(): boolean {
    return this.isInitialized;
  }
}

/**
 * 광고 단위 ID 설정
 * 개발 중에는 테스트 ID 사용, 프로덕션에서는 실제 ID로 교체
 */
export const AdUnitIds = {
  // iOS 광고 단위 ID
  ios: {
    banner: __DEV__
      ? 'ca-app-pub-3940256099942544/2934735716'
      : 'ca-app-pub-3195009493032065/9542885198',
    interstitial: __DEV__
      ? 'ca-app-pub-3940256099942544/4411468910'
      : 'YOUR_IOS_INTERSTITIAL_AD_UNIT_ID',
    rewarded: __DEV__
      ? 'ca-app-pub-3940256099942544/1712485313'
      : 'YOUR_IOS_REWARDED_AD_UNIT_ID',
  },

  // Android 광고 단위 ID
  android: {
    banner: __DEV__
      ? 'ca-app-pub-3940256099942544/6300978111'
      : 'YOUR_ANDROID_BANNER_AD_UNIT_ID',
    interstitial: __DEV__
      ? 'ca-app-pub-3940256099942544/1033173712'
      : 'YOUR_ANDROID_INTERSTITIAL_AD_UNIT_ID',
    rewarded: __DEV__
      ? 'ca-app-pub-3940256099942544/5224354917'
      : 'YOUR_ANDROID_REWARDED_AD_UNIT_ID',
  },
} as const;

/**
 * 플랫폼별 광고 단위 ID 가져오기
 */
export const getAdUnitId = (
  adType: 'banner' | 'interstitial' | 'rewarded'
): string => {
  const platform = require('react-native').Platform.OS as 'ios' | 'android';
  return AdUnitIds[platform][adType];
};
