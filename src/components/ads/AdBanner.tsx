import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

interface AdBannerProps {
  /** 광고 단위 ID (선택사항, 기본값은 테스트 ID) */
  adUnitId?: string;
  /** 배너 크기 (기본값: BANNER) */
  size?: BannerAdSize;
  /** 추가 스타일 */
  style?: any;
}

/**
 * Google AdMob 배너 광고 컴포넌트
 * 하단 내비게이션 바 위에 표시되는 320x50 배너 광고
 */
export const AdBanner: React.FC<AdBannerProps> = ({
  adUnitId,
  size = BannerAdSize.BANNER, // 320x50 표준 배너
  style,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 개발 중에는 테스트 ID 사용, 프로덕션에서는 실제 광고 단위 ID 사용
  const finalAdUnitId = adUnitId || TestIds.BANNER;

  const handleAdLoaded = () => {
    setIsLoaded(true);
    setHasError(false);
    console.log('📱 AdMob 배너 광고 로드 완료');
  };

  const handleAdFailedToLoad = (error: any) => {
    setIsLoaded(false);
    setHasError(true);
    console.error('❌ AdMob 배너 광고 로드 실패:', error);
  };

  const handleAdOpened = () => {
    console.log('🔗 AdMob 배너 광고 클릭됨');
  };

  const handleAdClosed = () => {
    console.log('🔙 AdMob 배너 광고 닫힘');
  };

  // 에러가 발생했거나 로드되지 않았을 때는 빈 공간 표시
  if (hasError) {
    return <View style={[styles.bannerContainer, style]} />;
  }

  return (
    <View style={[styles.bannerContainer, style]}>
      <BannerAd
        unitId={finalAdUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false, // 개인화 광고 허용
          keywords: [
            '한자',
            '중국어',
            '학습',
            '교육',
            '단어장',
            'chinese',
            'learning',
          ], // 관련 키워드
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
        onAdOpened={handleAdOpened}
        onAdClosed={handleAdClosed}
      />
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
});
