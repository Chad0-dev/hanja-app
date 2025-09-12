import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

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
    bottom: 90, // 네비게이션 바(약 80px) 위쪽에 10px 여백
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 10,
    zIndex: 1000, // 다른 컴포넌트 위에 표시
  },
  banner: {
    width: Math.min(320, screenWidth - 20), // 320px 또는 화면 너비에 맞춤
    height: 50,
    backgroundColor: '#4285F4', // 구글 블루 색상
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a73e8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
