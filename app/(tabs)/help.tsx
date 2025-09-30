import { AdBannerSafe, getAdUnitId } from '@/src/components';
import React, { useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, { runOnJS, useSharedValue } from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 도움말 카드 데이터
const helpCards = [
  {
    title: '기본 사용법',
    content: [
      '• 카드를 좌우로 스와이프하여 한자를 학습하세요',
      '• 카드를 탭하면 앞뒤가 뒤바뀝니다',
      '• 뒤로가기 버튼으로 이전 카드를 볼수 있습니다',
      '• 급수 버튼을 눌러 학습 급수를 선택할 수 있습니다',
    ],
  },
  {
    title: '단어장',
    content: [
      '• 하단 단어장 탭에서 모든 한자와 단어를 확인',
      '• 급수별 검색 및 원하는 한자 찾기 기능 제공',
      '• 한자 카드와 단어 카드로 구분하여 학습',
    ],
  },
  {
    title: '학습 팁',
    content: [
      '• 연관 한자가 포함된 단어들이 연속으로 나타납니다',
      '• 반복 학습을 통해 한자의 의미를 체득하세요',
      '• 꾸준한 학습이 한자 실력 향상의 지름길입니다',
    ],
  },
  {
    title: '앱 정보',
    content: [
      '• 총 1,301개 한자, 784개 완성 단어 수록',
      '• 8급~3급 체계적 학습 시스템',
      '• 인터넷이 필요없는 오프라인 학습',
    ],
  },
];

export default function HelpScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 스와이프 추적을 위한 shared value
  const hasStartedSwipe = useSharedValue(false);

  // 다음 카드로 이동
  const goToNext = () => {
    if (currentIndex < helpCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // 이전 카드로 이동
  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // 제스처 핸들러 (새로운 Gesture API)
  const panGesture = Gesture.Pan()
    .onStart(() => {
      hasStartedSwipe.value = false;
    })
    .onUpdate(event => {
      // 실제 드래그가 시작된 시점 확인
      const dragDistance =
        Math.abs(event.translationX) + Math.abs(event.translationY);
      if (dragDistance > 10 && !hasStartedSwipe.value) {
        hasStartedSwipe.value = true;
      }
    })
    .onEnd(event => {
      const threshold = screenWidth * 0.2;
      const { translationX, velocityX } = event;

      // 빠른 속도로 스와이프했거나 임계점을 넘었는지 확인
      const shouldSwipeLeft = translationX < -threshold || velocityX < -500;
      const shouldSwipeRight = translationX > threshold || velocityX > 500;

      if (shouldSwipeLeft) {
        runOnJS(goToNext)();
      } else if (shouldSwipeRight) {
        runOnJS(goToPrev)();
      }
    });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ImageBackground
        source={require('@/assets/images/backgraund2.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.container}>
          {/* 카드 컨테이너 */}
          <View style={styles.cardContainer}>
            <GestureDetector gesture={panGesture}>
              <Animated.View style={styles.card}>
                <Text style={styles.cardTitle}>
                  {helpCards[currentIndex].title}
                </Text>
                <ScrollView
                  style={styles.cardContent}
                  showsVerticalScrollIndicator={false}
                >
                  {helpCards[currentIndex].content.map((item, index) => (
                    <Text key={index} style={styles.cardText}>
                      {item}
                    </Text>
                  ))}
                </ScrollView>

                {/* 카드 내부 페이지 인디케이터 */}
                <View style={styles.cardIndicatorContainer}>
                  {helpCards.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.cardIndicator,
                        index === currentIndex && styles.cardActiveIndicator,
                      ]}
                    />
                  ))}
                </View>
              </Animated.View>
            </GestureDetector>
          </View>
        </View>

        {/* 하단 광고 배너 - 안전한 AdMob 배너 */}
        <AdBannerSafe adUnitId={getAdUnitId('banner')} />
      </ImageBackground>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  container: {
    flex: 1,
    paddingTop: 20,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#f8f6f2',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#8b7355',
    padding: 10,
    width: Math.min(350, screenWidth - 40),
    height: screenHeight * 0.4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
    justifyContent: 'flex-start',
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c2c2c',
    textAlign: 'center',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#d4af37',
    paddingBottom: 10,
  },
  cardContent: {
    flex: 1,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 28,
    color: '#4a4a4a',
    marginBottom: 15,
  },
  cardIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 5,
  },
  cardIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(139, 115, 85, 0.3)',
    marginHorizontal: 4,
  },
  cardActiveIndicator: {
    backgroundColor: '#8b7355',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
