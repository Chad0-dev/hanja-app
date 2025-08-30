import React, { useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { HanjaWordCard } from '../types';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.3; // 화면 너비의 30%

interface FlippableHanjaCardProps {
  /** 한자 단어 카드 데이터 */
  card: HanjaWordCard;
  /** 왼쪽으로 스와이프했을 때 실행할 콜백 */
  onSwipeLeft?: () => void;
  /** 오른쪽으로 스와이프했을 때 실행할 콜백 */
  onSwipeRight?: () => void;
  /** 스와이프가 시작되었을 때 실행할 콜백 */
  onSwipeStart?: () => void;
  /** 스와이프가 취소되었을 때 실행할 콜백 */
  onSwipeCancel?: () => void;
  /** 카드 뒤집기가 시작되었을 때 실행할 콜백 */
  onFlipStart?: () => void;
  /** 카드 뒤집기가 완료되었을 때 실행할 콜백 */
  onFlipEnd?: () => void;
  /** 카드 스타일 커스터마이징 */
  cardStyle?: ViewStyle;
  /** 텍스트 숨기기 (배경 카드용) */
  hideText?: boolean;
}

export const FlippableHanjaCard: React.FC<FlippableHanjaCardProps> = ({
  card,
  onSwipeLeft,
  onSwipeRight,
  onSwipeStart,
  onSwipeCancel,
  onFlipStart,
  onFlipEnd,
  cardStyle,
  hideText = false,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // 제스처와 애니메이션을 위한 shared values - 메모리 최적화
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const hasStartedSwipe = useSharedValue(false);

  // 애니메이션 제거 - 크래시 방지

  // 카드 뒤집기 함수 - 크래시 방지를 위한 최대 단순화
  const flipCard = () => {
    // 뒤집기 시작 콜백
    if (onFlipStart) {
      onFlipStart();
    }

    // 즉시 상태 변경 (애니메이션 없이)
    setIsFlipped(!isFlipped);

    // 뒤집기 완료 콜백 (약간의 딜레이 후)
    setTimeout(() => {
      if (onFlipEnd) {
        onFlipEnd();
      }
    }, 100);
  };

  /**
   * 카드를 초기 위치로 되돌리는 함수
   */
  const resetCard = () => {
    'worklet';
    translateX.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
    });
    translateY.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
    });
    opacity.value = 1;
  };

  /**
   * 카드를 화면 밖으로 애니메이션하는 함수
   */
  const animateCardOut = (direction: 'left' | 'right') => {
    'worklet';
    const targetX =
      direction === 'left' ? -screenWidth * 1.5 : screenWidth * 1.5;

    translateX.value = withSpring(targetX, {
      damping: 12,
      stiffness: 200,
      mass: 0.8,
    });

    translateY.value = withSpring(-100, {
      damping: 12,
      stiffness: 200,
      mass: 0.8,
    });

    opacity.value = withSpring(0, {
      damping: 12,
      stiffness: 200,
      mass: 0.8,
    });
  };

  /**
   * 스와이프 제스처 핸들러
   */
  const gestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: () => {
        hasStartedSwipe.value = false;
      },
      onActive: event => {
        // 실제 드래그가 시작된 시점에서만 스와이프 시작 콜백 실행 (한번만)
        const dragDistance =
          Math.abs(event.translationX) + Math.abs(event.translationY);
        if (dragDistance > 5 && !hasStartedSwipe.value && onSwipeStart) {
          hasStartedSwipe.value = true;
          runOnJS(onSwipeStart)();
        }

        // 카드 위치 업데이트
        translateX.value = event.translationX;
        translateY.value = event.translationY * 0.3;
        opacity.value = 1;
      },
      onEnd: event => {
        const { translationX, velocityX } = event;

        // 빠른 속도로 스와이프했거나 임계점을 넘었는지 확인
        const shouldSwipeLeft =
          translationX < -SWIPE_THRESHOLD || velocityX < -500;
        const shouldSwipeRight =
          translationX > SWIPE_THRESHOLD || velocityX > 500;

        if (shouldSwipeLeft) {
          animateCardOut('left');
          if (onSwipeLeft) {
            runOnJS(onSwipeLeft)();
          }
        } else if (shouldSwipeRight) {
          animateCardOut('right');
          if (onSwipeRight) {
            runOnJS(onSwipeRight)();
          }
        } else {
          resetCard();
          if (hasStartedSwipe.value && onSwipeCancel) {
            runOnJS(onSwipeCancel)();
          }
        }
      },
    });

  /**
   * 카드 애니메이션 스타일
   */
  const cardAnimatedStyle = useAnimatedStyle(() => {
    // 회전 각도 계산 (X 이동량에 비례) - 메모리 최적화
    const rotation = interpolate(
      translateX.value,
      [-screenWidth / 2, 0, screenWidth / 2],
      [-15, 0, 15], // 간단한 회전각도로 최적화
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotation}deg` },
      ],
      opacity: opacity.value,
    };
  });

  // 애니메이션 스타일 제거 - 크래시 방지를 위한 단순화

  /**
   * 좌측 액션 인디케이터 스타일
   */
  const leftActionStyle = useAnimatedStyle(() => {
    const leftOpacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, -50, 0],
      [1, 0.7, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity: leftOpacity,
    };
  });

  /**
   * 우측 액션 인디케이터 스타일
   */
  const rightActionStyle = useAnimatedStyle(() => {
    const rightOpacity = interpolate(
      translateX.value,
      [0, 50, SWIPE_THRESHOLD],
      [0, 0.7, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity: rightOpacity,
    };
  });

  if (hideText) {
    return (
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
          <View style={[styles.card, styles.hiddenCard, cardStyle]} />
        </Animated.View>
      </PanGestureHandler>
    );
  }

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
        {/* 액션 인디케이터들 */}
        <Animated.View
          style={[styles.actionIndicator, styles.leftAction, leftActionStyle]}
        >
          <Text style={styles.actionText}>❌</Text>
        </Animated.View>

        <Animated.View
          style={[styles.actionIndicator, styles.rightAction, rightActionStyle]}
        >
          <Text style={styles.actionText}>✅</Text>
        </Animated.View>

        {/* 단순한 조건부 렌더링 - 크래시 방지 */}
        {!isFlipped ? (
          /* 앞면 카드 - 한자 단어만 표시 */
          <View style={[styles.card, styles.frontCard]}>
            <TouchableOpacity
              style={styles.fullCardContainer}
              onPress={flipCard}
              activeOpacity={0.8}
            >
              <Text style={styles.hanjaText}>{card.word}</Text>
              <Text style={styles.tapHint}>탭하여 뒤집기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* 뒷면 카드 - 발음, 뜻, 구성 한자 정보 */
          <View style={[styles.card, styles.backCard]}>
            <TouchableOpacity
              style={styles.fullCardContainer}
              onPress={flipCard}
              activeOpacity={0.8}
            >
              <Text style={styles.pronunciationText}>{card.pronunciation}</Text>
              <Text style={styles.meaningText}>{card.meaning}</Text>

              {/* 구성 한자들 정보 */}
              <View style={styles.charactersContainer}>
                <Text style={styles.charactersTitle}>구성 한자:</Text>
                {card.characters.map((char, index) => (
                  <View key={char.id} style={styles.characterInfo}>
                    <Text style={styles.characterText}>
                      {char.character} ({char.pronunciation}): {char.meaning}
                    </Text>
                    <Text style={styles.characterDetails}>
                      {char.strokeCount}획, {char.radicalName}({char.radical})
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={styles.tapHint}>탭하여 뒤집기</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: 300,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f6f2', // 따뜻한 오프화이트
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  hiddenCard: {
    backgroundColor: '#f6f4f0', // 부드러운 오프화이트
  },
  frontCard: {
    // 앞면 카드 전용 스타일
  },
  backCard: {
    backgroundColor: '#faf8f5', // 따뜻한 오프화이트
  },
  fullCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: 30,
  },
  hanjaText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 20,
  },

  pronunciationText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#444',
    textAlign: 'center',
    marginBottom: 10,
  },
  meaningText: {
    fontSize: 24,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  strokeText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  charactersContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    width: '100%',
    alignItems: 'center',
  },
  charactersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
  },
  characterInfo: {
    marginBottom: 8,
    alignItems: 'center',
  },
  characterText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  characterDetails: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  tapHint: {
    position: 'absolute',
    bottom: 20,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  actionIndicator: {
    position: 'absolute',
    top: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  leftAction: {
    left: 20,
  },
  rightAction: {
    right: 20,
  },
  actionText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
