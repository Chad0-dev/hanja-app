import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { HanjaWordCard } from '../types';
import { FlippableHanjaCard } from './FlippableHanjaCard';

interface DeckCardProps {
  card: HanjaWordCard;
  index: number;
  isTopCard: boolean;
  cardTransition: any;
  reverseAnimation?: any;
  justFinishedReverse?: any;
  isFlipping: boolean;
  isPlayingReverse?: boolean;
  onSwipeLeft?: (card: HanjaWordCard) => void;
  onSwipeRight?: (card: HanjaWordCard) => void;
  onSwipeStart?: () => void;
  onSwipeCancel?: () => void;
  onFlipStart?: () => void;
  onFlipEnd?: () => void;
}

/**
 * 개별 카드 렌더링 컴포넌트
 * 애니메이션 스타일과 제스처 처리를 담당
 */
export const DeckCard: React.FC<DeckCardProps> = ({
  card,
  index,
  isTopCard,
  cardTransition,
  reverseAnimation,
  justFinishedReverse,
  isFlipping,
  isPlayingReverse = false,
  onSwipeLeft,
  onSwipeRight,
  onSwipeStart,
  onSwipeCancel,
  onFlipStart,
  onFlipEnd,
}) => {
  const animatedCardStyle = useAnimatedStyle(() => {
    const targetScale = 1 - index * 0.08;
    const targetOpacity = 1 - index * 0.25;
    const targetTranslateY = index * 8;

    // 역재생 중이거나 방금 완료된 경우 cardTransition 애니메이션 완전히 우회
    if ((isPlayingReverse || justFinishedReverse?.value > 0) && index === 0) {
      return {
        transform: [
          { scale: targetScale }, // 고정값 사용 (팝업 효과 없음)
          { translateY: targetTranslateY }, // 고정값 사용
          { translateX: reverseAnimation?.value || 0 }, // 역방향 애니메이션만 적용
        ],
        opacity: targetOpacity, // 고정값 사용
      };
    }

    const animatedScale = interpolate(
      cardTransition.value,
      [0, 0.6, 1],
      [1 - (index + 1) * 0.08, targetScale * 1.02, targetScale],
      Extrapolate.CLAMP
    );

    const animatedOpacity = interpolate(
      cardTransition.value,
      [0, 1],
      [1 - (index + 1) * 0.25, targetOpacity],
      Extrapolate.CLAMP
    );

    // 2번째 카드는 항상 완전 불투명, 단 뒤집기 중일 때는 숨김
    const finalOpacity = index === 1 ? (isFlipping ? 0 : 1) : animatedOpacity;

    const animatedTranslateY = interpolate(
      cardTransition.value,
      [0, 0.7, 1],
      [(index + 1) * 8, targetTranslateY * 0.95, targetTranslateY],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { scale: animatedScale },
        { translateY: animatedTranslateY },
        { translateX: 0 },
      ],
      opacity: finalOpacity,
    };
  });

  return (
    <Animated.View
      key={`${card.id}-${index}`}
      style={[
        styles.cardWrapper,
        {
          zIndex: 1000 - index,
          backgroundColor: 'transparent',
          borderRadius: 20,
          shadowColor: '#8B7355', // 메인 카드와 동일한 그림자 색상
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 15,
        },
        animatedCardStyle,
      ]}
    >
      <FlippableHanjaCard
        card={card}
        onSwipeLeft={isTopCard ? onSwipeLeft : undefined}
        onSwipeRight={isTopCard ? onSwipeRight : undefined}
        onSwipeStart={isTopCard ? onSwipeStart : undefined}
        onSwipeCancel={isTopCard ? onSwipeCancel : undefined}
        onFlipStart={isTopCard ? onFlipStart : undefined}
        onFlipEnd={isTopCard ? onFlipEnd : undefined}
        isInteractive={isTopCard}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
