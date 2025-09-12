import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

/**
 * 하단 배너 광고 목업 컴포넌트
 * 실제 AdMob 구현 전 위치와 크기를 확인하기 위한 목업
 */
export const AdBannerMockup: React.FC = () => {
  return (
    <View style={styles.bannerContainer}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>📱 광고 배너 영역</Text>
        <Text style={styles.bannerSubText}>320x50 AdMob 배너</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    bottom: 80, // 네비게이션 바(약 80px) 바로 위에 마진 없이
    left: 0,
    right: 0,
    zIndex: 1000, // 다른 컴포넌트 위에 표시
  },
  banner: {
    width: '100%', // 화면 100% 너비
    height: 50,
    backgroundColor: '#4285F4', // 구글 블루 색상
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1, // 상단만 테두리
    borderTopColor: '#1a73e8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2, // 위쪽 그림자
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 5,
  },
  bannerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bannerSubText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
});
