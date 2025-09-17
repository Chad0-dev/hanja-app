import React from 'react';
import { StyleSheet, View } from 'react-native';
import { withSpring } from 'react-native-reanimated';
import { useCardAnimations } from '../hooks/useCardAnimations';
import { HanjaWordCard } from '../types';
import { CelebrationCard } from './CelebrationCard';
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

/**
 * CardDeck: 카드 스택을 관리하고 애니메이션을 처리하는 메인 컴포넌트
 *
 * 개선사항:
 * - 애니메이션 로직을 useCardAnimations 훅으로 분리
 * - 개별 카드 렌더링을 DeckCard 컴포넌트로 분리
 * - 복잡한 내부 로직을 단순화하여 가독성 향상
 */
export const CardDeck: React.FC<CardDeckProps> = ({
  cards,
  onSwipeLeft,
  onSwipeRight,
  maxVisibleCards = 2,
  shouldPlayReverseAnimation = false,
  reverseDirection = 'right',
  onReverseAnimationComplete,
}) => {
  // 애니메이션 상태 및 로직을 훅으로 분리
  const animations = useCardAnimations(cards, {
    shouldPlayReverseAnimation,
    reverseDirection,
    onReverseAnimationComplete,
  });

  // 렌더링할 카드 수 제한 (성능 최적화)
  const visibleCards = React.useMemo(
    () => cards.slice(0, maxVisibleCards),
    [cards, maxVisibleCards]
  );

  // 카드가 없으면 축하 카드 표시
  if (cards.length === 0) {
    return (
      <View style={styles.deckContainer}>
        <CelebrationCard />
      </View>
    );
  }

  const handleSwipeStart = () => {
    if (animations.cardTransition) {
      animations.cardTransition.value = 0;
    }
  };

  const handleSwipeCancel = () => {
    if (animations.cardTransition) {
      animations.cardTransition.value = withSpring(1, {
        damping: 15,
        stiffness: 180,
      });
    }
  };

  const handleFlipStart = () => {
    animations.setIsFlipping(true);
  };

  const handleFlipEnd = () => {
    animations.setIsFlipping(false);
  };

  return (
    <View style={styles.deckContainer}>
      {visibleCards.map((card, index) => (
        <DeckCard
          key={`deck-${card.id}-${index}-${cards[0]?.id || 'empty'}`}
          card={card}
          index={index}
          isTopCard={index === 0}
          cardTransition={animations.cardTransition}
          reverseAnimation={animations.reverseAnimation}
          justFinishedReverse={animations.justFinishedReverse}
          isFlipping={animations.isFlipping}
          isPlayingReverse={animations.isPlayingReverse}
          onSwipeLeft={onSwipeLeft}
          onSwipeRight={onSwipeRight}
          onSwipeStart={handleSwipeStart}
          onSwipeCancel={handleSwipeCancel}
          onFlipStart={handleFlipStart}
          onFlipEnd={handleFlipEnd}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  deckContainer: {
    width: 300,
    height: 400,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
