import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { useSharedValue, withSpring } from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

export interface CardAnimationState {
  cardTransition: any;
  reverseAnimation: any;
  justFinishedReverse: any;
  isFlipping: boolean;
  isPlayingReverse: boolean;
  setIsFlipping: (value: boolean) => void;
  setIsPlayingReverse: (value: boolean) => void;
}

export interface ReverseAnimationConfig {
  shouldPlayReverseAnimation: boolean;
  reverseDirection: 'left' | 'right';
  onReverseAnimationComplete?: () => void;
}

/**
 * 카드 애니메이션 상태 및 로직을 관리하는 훅
 */
export const useCardAnimations = (
  cards: any[],
  reverseConfig: ReverseAnimationConfig
): CardAnimationState => {
  const cardTransition = useSharedValue(0);
  const reverseAnimation = useSharedValue(0);
  const justFinishedReverse = useSharedValue(0);

  const [isFlipping, setIsFlipping] = useState(false);
  const [isPlayingReverse, setIsPlayingReverse] = useState(false);

  // 카드 변경 시 일반 애니메이션
  useEffect(() => {
    if (
      cards.length >= 1 &&
      !isPlayingReverse &&
      justFinishedReverse.value === 0
    ) {
      cardTransition.value = 0;
      cardTransition.value = withSpring(1, {
        damping: 15,
        stiffness: 180,
        mass: 0.9,
        restSpeedThreshold: 0.01,
        restDisplacementThreshold: 0.01,
      });
    }
  }, [cards[0]?.id, isPlayingReverse]);

  // 역방향 애니메이션
  useEffect(() => {
    if (reverseConfig.shouldPlayReverseAnimation && !isPlayingReverse) {
      setIsPlayingReverse(true);

      const startPosition =
        reverseConfig.reverseDirection === 'left' ? -screenWidth : screenWidth;
      console.log(
        `🔄 역방향 애니메이션 시작: ${reverseConfig.reverseDirection} 방향에서 복귀`
      );

      reverseAnimation.value = startPosition;
      reverseAnimation.value = withSpring(0, {
        damping: 12,
        stiffness: 200,
        mass: 0.8,
      });

      setTimeout(() => {
        setIsPlayingReverse(false);
        reverseConfig.onReverseAnimationComplete?.();

        cardTransition.value = 1;
        justFinishedReverse.value = 1;

        setTimeout(() => {
          justFinishedReverse.value = 0;
        }, 200);
      }, 800);
    }
  }, [
    reverseConfig.shouldPlayReverseAnimation,
    reverseConfig.reverseDirection,
  ]);

  return {
    cardTransition,
    reverseAnimation,
    justFinishedReverse,
    isFlipping,
    isPlayingReverse,
    setIsFlipping,
    setIsPlayingReverse,
  };
};
