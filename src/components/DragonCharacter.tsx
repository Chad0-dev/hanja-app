import React, { useEffect, useState } from 'react';
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

  // 애니메이션 값
  const opacity = useSharedValue(1);

  // 카드 인덱스가 변할 때마다 드래곤 변경
  useEffect(() => {
    const newDragonIndex = cardIndex % DRAGON_IMAGES.length;

    if (newDragonIndex !== currentDragonIndex) {
      // 재미있는 변신 애니메이션
      playTransformAnimation(() => {
        setCurrentDragonIndex(newDragonIndex);
      });
    }
  }, [cardIndex, currentDragonIndex]);

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
