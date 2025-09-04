import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface DragonCharacterProps {
  /** 현재 카드 인덱스 (이 값이 변할 때마다 드래곤이 변함) */
  cardIndex: number;
  /** 드래곤 이미지 스타일 */
  style?: any;
}

// 드래곤 이미지들
const DRAGON_IMAGES = [
  require('@/assets/images/Dragon1.png'),
  require('@/assets/images/Dragon2.png'),
  require('@/assets/images/Dragon3.png'),
  require('@/assets/images/Dragon4.png'),
  require('@/assets/images/Dragon5.png'),
];

/**
 * DragonCharacter: 카드 변화에 따라 드래곤 캐릭터가 변하는 컴포넌트
 *
 * 기능:
 * - 카드 인덱스에 따라 드래곤 이미지 순환 표시
 * - 변화할 때마다 재미있는 애니메이션 효과
 * - 부드러운 전환과 바운스 효과
 */
export const DragonCharacter: React.FC<DragonCharacterProps> = ({
  cardIndex,
  style,
}) => {
  const [currentDragonIndex, setCurrentDragonIndex] = useState(0);
  const [lastCardIndex, setLastCardIndex] = useState(-1); // 이전 카드 인덱스 추적

  // 애니메이션 값
  const opacity = useSharedValue(1);

  // 이전 드래곤과 다른 드래곤을 선택하는 함수
  const getNextDragonIndex = useCallback((currentIndex: number): number => {
    const availableIndices = Array.from(
      { length: DRAGON_IMAGES.length },
      (_, i) => i
    ).filter(i => i !== currentIndex);

    if (availableIndices.length === 0) {
      return 0; // 안전장치
    }

    return availableIndices[
      Math.floor(Math.random() * availableIndices.length)
    ];
  }, []);

  // 카드 인덱스가 변할 때마다 드래곤 변경
  useEffect(() => {
    // cardIndex가 실제로 변했는지 확인 (다중급수 선택 시에도 동작하도록)
    if (cardIndex !== lastCardIndex) {

      // 특별 케이스: 카드 스택 재초기화 (-1 → 0)
      const isStackReset = lastCardIndex === -1 && cardIndex === 0;

      // 애니메이션 실행하면서 드래곤 인덱스 업데이트
      playTransformAnimation(() => {
        setCurrentDragonIndex(prevIndex => {
          // 항상 최신 상태를 기반으로 다음 드래곤 선택
          const newDragonIndex = getNextDragonIndex(prevIndex);


          return newDragonIndex;
        });
      });

      // 이전 카드 인덱스 업데이트
      setLastCardIndex(cardIndex);
    }
  }, [cardIndex, lastCardIndex]);

  const playTransformAnimation = (onMiddle: () => void) => {
    // 자연스러운 페이드 아웃
    opacity.value = withSpring(0.0, { damping: 20, stiffness: 300 });

    // 이미지 변경
    setTimeout(() => {
      onMiddle();

      // 자연스러운 페이드 인
      opacity.value = withSpring(1.0, { damping: 20, stiffness: 300 });
    }, 200);
  };

  // 애니메이션 스타일 (단순하게)
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.dragonWrapper, animatedStyle]}>
        <Image
          source={DRAGON_IMAGES[currentDragonIndex]}
          style={styles.dragonImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragonImage: {
    width: 120,
    height: 120,
  },
});
