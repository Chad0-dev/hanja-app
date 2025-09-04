import { HamburgerMenu } from '@/src/components';
import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

export default function WordbookScreen() {
  return (
    <ImageBackground
      source={require('@/assets/images/backgraund1.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* 햄버거 메뉴 */}
      <HamburgerMenu />

      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* 단어장 컨텐츠 영역 */}
          <Text style={styles.placeholderText}>
            단어장 페이지
            {'\n'}
            준비 중입니다...
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // 약간의 오버레이
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  placeholderText: {
    fontSize: 24,
    color: '#2c1810', // 먹색
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#8B7355', // 갈색 테두리
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
