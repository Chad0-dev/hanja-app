import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HanjaWordCard } from '../types';
import { useCardAnimations } from '../hooks/useCardAnimations';
import { DeckCard } from './DeckCard';



interface CardDeckProps {
  /** 표시할 한자 단어 카드 배열 (맨 앞이 최상위 카드) */
  cards: HanjaWordCard[];
  /** 왼쪽 스와이프 콜백 */
  onSwipeLeft: (card: HanjaWordCard) => void;
  /** 오른쪽 스와이프 콜백 */
  onSwipeRight: (card: HanjaWordCard) => void;
  /** 렌더링할 최대 카드 수 (성능 최적화) */
  maxVisibleCards?: number;
  /** 역방향 애니메이션 트리거 */
  shouldPlayReverseAnimation?: boolean;
  /** 역방향 애니메이션 방향 */
  reverseDirection?: 'left' | 'right';
  /** 역방향 애니메이션 완료 콜백 */
  onReverseAnimationComplete?: () => void;
}

// 개별 카드 렌더 컴포넌트 (hooks는 컴포넌트 내부에서만 호출)
const DeckCard: React.FC<{
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
}> = ({
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
    if ((isPlayingReverse || justFinishedReverse.value > 0) && index === 0) {
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
          elevation: (2 - index) * 3,
        },
        animatedCardStyle,
      ]}
    >
      <FlippableHanjaCard
        card={card}
        onSwipeLeft={
          isTopCard ? () => onSwipeLeft && onSwipeLeft(card) : undefined
        }
        onSwipeRight={
          isTopCard ? () => onSwipeRight && onSwipeRight(card) : undefined
        }
        onSwipeStart={isTopCard ? onSwipeStart : undefined}
        onSwipeCancel={isTopCard ? onSwipeCancel : undefined}
        onFlipStart={isTopCard ? onFlipStart : undefined}
        onFlipEnd={isTopCard ? onFlipEnd : undefined}
        hideText={!isTopCard} // 2번째 카드는 텍스트 숨김
      />
    </Animated.View>
  );
};

export const CardDeck: React.FC<CardDeckProps> = ({
  cards,
  onSwipeLeft,
  onSwipeRight,
  maxVisibleCards = 2, // 안전하게 2장만 렌더링
  shouldPlayReverseAnimation = false,
  reverseDirection = 'right',
  onReverseAnimationComplete,
}) => {
  const cardTransition = useSharedValue(0);
  const reverseAnimation = useSharedValue(0); // 역방향 애니메이션용
  const justFinishedReverse = useSharedValue(0); // 역재생 완료 플래그 (shared value)
  const [isFlipping, setIsFlipping] = React.useState(false); // 뒤집기 상태 추적
  const [isPlayingReverse, setIsPlayingReverse] = React.useState(false);

  // Tinder 스타일: 2장 렌더링하되 2번째는 배경만 - 메모리 최적화
  const visibleCards = React.useMemo(() => cards.slice(0, 2), [cards]);

  // 첫 번째 카드가 바뀔 때마다 애니메이션 트리거 (역재생 완료 직후 제외)
  useEffect(() => {
    if (
      cards.length >= 1 &&
      !isPlayingReverse &&
      justFinishedReverse.value === 0
    ) {
      cardTransition.value = 0;

      // 부드럽고 자연스러운 팝업 애니메이션
      cardTransition.value = withSpring(1, {
        damping: 15,
        stiffness: 180,
        mass: 0.9,
        restSpeedThreshold: 0.01,
        restDisplacementThreshold: 0.01,
      });
    }
  }, [cards[0]?.id, isPlayingReverse]);

  // 역방향 애니메이션 트리거 (방향별)
  useEffect(() => {
    if (shouldPlayReverseAnimation && !isPlayingReverse) {
      setIsPlayingReverse(true);

      // 스와이프 방향에 따라 시작 위치 결정
      const startPosition =
        reverseDirection === 'left' ? -screenWidth : screenWidth;
      console.log(
        `🔄 역방향 애니메이션 시작: ${reverseDirection} 방향에서 복귀 (${startPosition}px에서 시작)`
      );

      // 역방향 스와이프 애니메이션
      reverseAnimation.value = startPosition; // 해당 방향 화면 밖에서 시작
      reverseAnimation.value = withSpring(0, {
        damping: 12,
        stiffness: 200,
        mass: 0.8,
      });

      // 애니메이션 완료 후 콜백 실행
      setTimeout(() => {
        setIsPlayingReverse(false);
        onReverseAnimationComplete?.();

        // 역재생 완료 후 cardTransition을 1로 직접 설정 (애니메이션 없이)
        cardTransition.value = 1;

        // 플래그 설정하여 애니메이션 방지
        justFinishedReverse.value = 1;
        setTimeout(() => {
          justFinishedReverse.value = 0;
        }, 200); // 충분한 시간 확보
      }, 800); // 애니메이션 시간에 맞춰 조정
    }
  }, [shouldPlayReverseAnimation, reverseDirection]);

  // 카드가 없으면 빈 컴포넌트 반환 (hooks 순서 유지)
  if (cards.length === 0) {
    return <View style={styles.deckContainer} />;
  }

  return (
    <View style={styles.deckContainer}>
      {visibleCards
        .map((card, index) => (
          <DeckCard
            key={`deck-${card.id}-${index}-${cards[0]?.id || 'empty'}`}
            card={card}
            index={index}
            isTopCard={index === 0}
            cardTransition={cardTransition}
            reverseAnimation={reverseAnimation}
            justFinishedReverse={justFinishedReverse}
            isFlipping={isFlipping}
            isPlayingReverse={isPlayingReverse}
            onSwipeLeft={onSwipeLeft}
            onSwipeRight={onSwipeRight}
            onSwipeStart={() => {
              if (index === 0) {
                cardTransition.value = 0;
              }
            }}
            onSwipeCancel={() => {
              if (index === 0) {
                // 스와이프 취소 시 cardTransition을 다시 1로 복원
                cardTransition.value = withSpring(1, {
                  damping: 15,
                  stiffness: 180,
                  mass: 0.9,
                  restSpeedThreshold: 0.01,
                  restDisplacementThreshold: 0.01,
                });
              }
            }}
            onFlipStart={() => {
              if (index === 0) {
                setIsFlipping(true);
              }
            }}
            onFlipEnd={() => {
              if (index === 0) {
                setIsFlipping(false);
              }
            }}
          />
        ))
        .reverse()}
      {/* reverse()로 zIndex가 높은 카드가 나중에 그려져 위로 올라감 */}
    </View>
  );
};

const styles = StyleSheet.create({
  deckContainer: {
    width: 300,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    // 카드 래퍼 자체에 배경 강화
    backgroundColor: 'transparent', // 투명하게 두고 내부에서 처리
  },
  card: {
    width: '100%',
    height: '100%',
  },
});
