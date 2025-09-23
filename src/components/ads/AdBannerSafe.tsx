import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AdBannerSafeProps {
  /** 광고 단위 ID (선택사항) */
  adUnitId?: string;
  /** 추가 스타일 */
  style?: any;
  /** 배너 표시 여부 (기본값: true) */
  visible?: boolean;
}

/**
 * 안전한 Google AdMob 배너 광고 컴포넌트
 * Expo Development Build에서는 목업을 표시하고,
 * 실제 빌드에서는 AdMob 배너를 표시
 */
export const AdBannerSafe: React.FC<AdBannerSafeProps> = ({
  adUnitId,
  style,
  visible = true,
}) => {
  // visible이 false면 아무것도 렌더링하지 않음
  if (!visible) {
    return null;
  }
  const [AdMobBanner, setAdMobBanner] =
    useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // AdMob 모듈 동적 로드 (EAS Build에서만)
  React.useEffect(() => {
    const loadAdMobModule = async () => {
      // Development Build에서는 항상 목업 표시
      if (__DEV__) {
        console.log('🔧 Development Build - AdMob 목업 배너 표시');
        setHasError(true); // 목업을 표시하기 위해 에러 상태로 설정
        setIsLoading(false);
        return;
      }

      // Production Build에서만 실제 AdMob 로드 시도
      try {
        // 네이티브 모듈 확인
        const { NativeModules } = require('react-native');
        if (!NativeModules.RNGoogleMobileAdsModule) {
          throw new Error('AdMob native module not available');
        }

        // AdMob 모듈 import
        const { BannerAd, BannerAdSize, TestIds } = await import(
          'react-native-google-mobile-ads'
        );

        // AdMob 배너 컴포넌트 생성
        const AdMobBannerComponent: React.FC<any> = props => (
          <BannerAd
            unitId={adUnitId || TestIds.BANNER}
            size={BannerAdSize.BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: false,
              keywords: [
                '한자',
                '중국어',
                '학습',
                '교육',
                '단어장',
                'chinese',
                'learning',
              ],
            }}
            onAdLoaded={() => console.log('📱 AdMob 배너 광고 로드 완료')}
            onAdFailedToLoad={(error: any) =>
              console.error('❌ AdMob 배너 광고 로드 실패:', error)
            }
            onAdOpened={() => console.log('🔗 AdMob 배너 광고 클릭됨')}
            onAdClosed={() => console.log('🔙 AdMob 배너 광고 닫힘')}
          />
        );

        setAdMobBanner(() => AdMobBannerComponent);
        setIsLoading(false);
        console.log('✅ Production Build - 실제 AdMob 배너 로드 완료');
      } catch (error) {
        console.warn('⚠️ AdMob 모듈 사용 불가:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    loadAdMobModule();
  }, [adUnitId]);

  // 로딩 중이거나 에러가 발생한 경우 목업 표시
  if (isLoading || hasError || !AdMobBanner) {
    return (
      <View style={[styles.bannerContainer, style]}>
        <View style={styles.mockupBanner}>
          <Text style={styles.mockupText}>📱 AdMob 배너 (목업)</Text>
          <Text style={styles.mockupSubText}>Development Build</Text>
        </View>
      </View>
    );
  }

  // AdMob 배너 표시
  return (
    <View style={[styles.bannerContainer, style]}>
      <AdMobBanner />
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    bottom: 80, // 네비게이션 바(약 80px) 바로 위
    left: 0,
    right: 0,
    height: 50, // 표준 배너 높이
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1000, // 다른 컴포넌트 위에 표시
  },
  mockupBanner: {
    width: '100%',
    height: 50,
    backgroundColor: '#4285F4', // 구글 블루
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1a73e8',
  },
  mockupText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mockupSubText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
});
