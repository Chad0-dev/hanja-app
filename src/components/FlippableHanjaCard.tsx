import React, { useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { isWordBookmarked, toggleWordBookmark } from '../database/hanjaDB';
import { useGradeSelection } from '../hooks/useGradeSelection';
import { HanjaWordCard } from '../types';
import { GradeSelector } from './GradeSelector';
import { refreshLearningProgress } from './LearningProgress';
import { IconSymbol } from './ui/IconSymbol';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.3; // 화면 너비의 30%

interface FlippableHanjaCardProps {
  /** 한자 단어 카드 데이터 */
  card: HanjaWordCard;
  /** 왼쪽으로 스와이프했을 때 실행할 콜백 */
  onSwipeLeft?: (card: HanjaWordCard) => void;
  /** 오른쪽으로 스와이프했을 때 실행할 콜백 */
  onSwipeRight?: (card: HanjaWordCard) => void;
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

export const FlippableHanjaCard: React.FC<FlippableHanjaCardProps> = React.memo(
  ({
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
    const {
      isGradeSelectorVisible,
      selectedGrades,
      showGradeSelection,
      closeGradeSelection,
      handleGradeChange,
      handleGradeConfirm,
    } = useGradeSelection();
    const [isFlipped, setIsFlipped] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

    // 컴포넌트 마운트 시 북마크 상태 로드
    React.useEffect(() => {
      const loadBookmarkStatus = async () => {
        try {
          const bookmarked = await isWordBookmarked(card.id);
          setIsBookmarked(bookmarked);
        } catch (error) {
          console.error('북마크 상태 로드 실패:', error);
        }
      };

      loadBookmarkStatus();
    }, [card.id]);

    // 북마크 토글 함수 (실제 DB 연동)
    const toggleBookmark = async (event: any) => {
      // 이벤트 전파 중지 (카드 뒤집기 방지)
      event.stopPropagation();

      if (isBookmarkLoading) return;

      setIsBookmarkLoading(true);
      try {
        const newBookmarkState = await toggleWordBookmark(card.id);
        setIsBookmarked(newBookmarkState);

        // 학습 현황 실시간 업데이트
        refreshLearningProgress();

        console.log(
          `📚 북마크 ${newBookmarkState ? '추가' : '제거'}: ${card.word}`
        );
      } catch (error) {
        console.error('북마크 토글 실패:', error);
      } finally {
        setIsBookmarkLoading(false);
      }
    };

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
     * 스와이프 제스처 핸들러 (새로운 Gesture API)
     */
    const panGesture = Gesture.Pan()
      .onStart(() => {
        hasStartedSwipe.value = false;
      })
      .onUpdate(event => {
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
      })
      .onEnd(event => {
        const { translationX, velocityX } = event;

        // 빠른 속도로 스와이프했거나 임계점을 넘었는지 확인
        const shouldSwipeLeft =
          translationX < -SWIPE_THRESHOLD || velocityX < -500;
        const shouldSwipeRight =
          translationX > SWIPE_THRESHOLD || velocityX > 500;

        if (shouldSwipeLeft) {
          animateCardOut('left');
          if (onSwipeLeft) {
            runOnJS(onSwipeLeft)(card);
          }
        } else if (shouldSwipeRight) {
          animateCardOut('right');
          if (onSwipeRight) {
            runOnJS(onSwipeRight)(card);
          }
        } else {
          resetCard();
          if (hasStartedSwipe.value && onSwipeCancel) {
            runOnJS(onSwipeCancel)();
          }
        }
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

    /**
     * 좌측 연관단어 하이라이트 애니메이션
     */
    const leftHighlightStyle = useAnimatedStyle(() => {
      const isActive = translateX.value < -50; // 왼쪽으로 50px 이상 스와이프 시 활성화

      return {
        backgroundColor: isActive
          ? 'rgba(200, 200, 200, 0.9)'
          : 'rgba(0, 0, 0, 0)',
        // transform 제거 - 정렬 안정성을 위해
        borderRadius: 12,
        paddingHorizontal: 6, // 고정값으로 변경
        paddingVertical: 3, // 고정값으로 변경
      };
    });

    /**
     * 우측 연관단어 하이라이트 애니메이션
     */
    const rightHighlightStyle = useAnimatedStyle(() => {
      const isActive = translateX.value > 50; // 오른쪽으로 50px 이상 스와이프 시 활성화

      return {
        backgroundColor: isActive
          ? 'rgba(200, 200, 200, 0.9)'
          : 'rgba(0, 0, 0, 0)',
        // transform 제거 - 정렬 안정성을 위해
        borderRadius: 12,
        paddingHorizontal: 6, // 고정값으로 변경
        paddingVertical: 3, // 고정값으로 변경
      };
    });

    /**
     * 좌측 텍스트 색상 애니메이션
     */
    const leftTextStyle = useAnimatedStyle(() => {
      return {
        color: translateX.value < -50 ? '#333333' : '#999',
        // fontWeight 제거 - 높이 차이 방지
      };
    });

    /**
     * 우측 텍스트 색상 애니메이션
     */
    const rightTextStyle = useAnimatedStyle(() => {
      return {
        color: translateX.value > 50 ? '#333333' : '#999',
        // fontWeight 제거 - 높이 차이 방지
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
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
            <View style={[styles.card, styles.hiddenCard, cardStyle]} />
          </Animated.View>
        </GestureDetector>
      );
    }

    return (
      <>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
            {/* 단순한 조건부 렌더링 - 크래시 방지 */}
            {!isFlipped ? (
              /* 앞면 카드 - 한자 단어만 표시 */
              <View style={[styles.card, styles.frontCard]}>
                {/* 급수 배지 - 오른쪽 상단 (클릭 가능) */}
                <TouchableOpacity
                  style={styles.gradeBadge}
                  onPress={showGradeSelection}
                  activeOpacity={0.7}
                >
                  <Text style={styles.gradeText}>
                    {typeof card.grade === 'string' && card.grade.includes('급')
                      ? card.grade
                      : `${card.grade}급`}
                  </Text>
                </TouchableOpacity>

                {/* 북마크 아이콘 - 급수 배지 아래 */}
                <TouchableOpacity
                  style={styles.bookmarkIconInCard}
                  onPress={toggleBookmark}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    size={22}
                    name="book.fill"
                    color={
                      isBookmarkLoading
                        ? 'rgba(44, 24, 16, 0.6)'
                        : isBookmarked
                          ? '#2c1810' // 활성화 시 진한 먹색
                          : 'rgba(44, 24, 16, 0.4)' // 비활성화 시 연한 먹색
                    }
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.fullCardContainer}
                  onPress={flipCard}
                  activeOpacity={0.8}
                >
                  <Text style={styles.hanjaText}>{card.word}</Text>
                  <Text style={styles.tapHint}>탭하여 뒤집기</Text>
                </TouchableOpacity>

                {/* 하단 연관단어 인디케이터들 - 하이라이트 애니메이션 */}
                <Animated.View
                  style={[
                    styles.swipeIndicator,
                    styles.leftSwipeIndicator,
                    leftHighlightStyle,
                  ]}
                >
                  <Animated.Text
                    style={[styles.swipeIndicatorText, leftTextStyle]}
                  >
                    {card.characters[0]?.character} 연관단어
                  </Animated.Text>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.swipeIndicator,
                    styles.rightSwipeIndicator,
                    rightHighlightStyle,
                  ]}
                >
                  <Animated.Text
                    style={[styles.swipeIndicatorText, rightTextStyle]}
                  >
                    {card.characters[1]?.character ||
                      card.characters[0]?.character}{' '}
                    연관단어
                  </Animated.Text>
                </Animated.View>
              </View>
            ) : (
              /* 뒷면 카드 - 발음, 뜻, 구성 한자 정보 */
              <View style={[styles.card, styles.backCard]}>
                {/* 급수 배지 - 오른쪽 상단 (클릭 가능) */}
                <TouchableOpacity
                  style={styles.gradeBadge}
                  onPress={showGradeSelection}
                  activeOpacity={0.7}
                >
                  <Text style={styles.gradeText}>
                    {typeof card.grade === 'string' && card.grade.includes('급')
                      ? card.grade
                      : `${card.grade}급`}
                  </Text>
                </TouchableOpacity>

                {/* 북마크 아이콘 - 급수 배지 아래 */}
                <TouchableOpacity
                  style={styles.bookmarkIconInCard}
                  onPress={toggleBookmark}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    size={22}
                    name="book.fill"
                    color={
                      isBookmarkLoading
                        ? 'rgba(44, 24, 16, 0.6)'
                        : isBookmarked
                          ? '#2c1810' // 활성화 시 진한 먹색
                          : 'rgba(44, 24, 16, 0.4)' // 비활성화 시 연한 먹색
                    }
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.fullCardContainer}
                  onPress={flipCard}
                  activeOpacity={0.8}
                >
                  <Text style={styles.pronunciationText}>
                    {card.pronunciation}
                  </Text>
                  <Text style={styles.meaningText}>{card.meaning}</Text>

                  {/* 구성 한자들 정보 */}
                  <View style={styles.charactersContainer}>
                    <Text style={styles.charactersTitle}>구성 한자:</Text>
                    {(() => {
                      // 한자 순서를 단어 순서에 맞게 정렬
                      const wordChars = card.word.split('');
                      const orderedChars = [];

                      // 단어의 각 한자 순서대로 매칭
                      for (let i = 0; i < wordChars.length; i++) {
                        const wordChar = wordChars[i];
                        const matchingChar = card.characters.find(
                          c => c.character === wordChar
                        );
                        if (matchingChar) {
                          orderedChars.push(matchingChar);
                        }
                      }

                      // 매칭되지 않은 한자들도 추가 (안전장치)
                      card.characters.forEach(char => {
                        if (
                          !orderedChars.find(
                            oc => oc.character === char.character
                          )
                        ) {
                          orderedChars.push(char);
                        }
                      });

                      return orderedChars.map((char, index) => (
                        <View key={char.id} style={styles.characterInfo}>
                          <Text style={styles.characterText}>
                            {char.character} {char.meaning} {char.pronunciation}
                          </Text>
                          <Text style={styles.characterDetails}>
                            {char.strokeCount}획, 부수 {char.radical}
                          </Text>
                        </View>
                      ));
                    })()}
                  </View>

                  <Text style={styles.tapHint}>탭하여 뒤집기</Text>
                </TouchableOpacity>

                {/* 하단 연관단어 인디케이터들 - 하이라이트 애니메이션 */}
                <Animated.View
                  style={[
                    styles.swipeIndicator,
                    styles.leftSwipeIndicator,
                    leftHighlightStyle,
                  ]}
                >
                  <Animated.Text
                    style={[styles.swipeIndicatorText, leftTextStyle]}
                  >
                    {card.characters[0]?.character} 연관단어
                  </Animated.Text>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.swipeIndicator,
                    styles.rightSwipeIndicator,
                    rightHighlightStyle,
                  ]}
                >
                  <Animated.Text
                    style={[styles.swipeIndicatorText, rightTextStyle]}
                  >
                    {card.characters[1]?.character ||
                      card.characters[0]?.character}{' '}
                    연관단어
                  </Animated.Text>
                </Animated.View>
              </View>
            )}
          </Animated.View>
        </GestureDetector>

        {/* 급수 선택 모달 */}
        <GradeSelector
          visible={isGradeSelectorVisible}
          onClose={closeGradeSelection}
          selectedGrades={selectedGrades}
          onGradeChange={handleGradeChange}
          onConfirm={handleGradeConfirm}
        />
      </>
    );
    // React.memo의 비교 함수 (성능 최적화)
  },
  (prevProps, nextProps) => {
    return (
      prevProps.card.id === nextProps.card.id &&
      prevProps.hideText === nextProps.hideText &&
      JSON.stringify(prevProps.cardStyle) ===
        JSON.stringify(nextProps.cardStyle)
    );
  }
);

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
    shadowColor: '#8B7355', // 배경과 어울리는 따뜻한 갈색 그림자
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.1)', // 그림자 색상과 매칭되는 테두리
    overflow: 'hidden',
    position: 'relative',
  },
  hiddenCard: {
    backgroundColor: '#f6f4f0', // 부드러운 오프화이트
  },
  frontCard: {
    // 앞면 카드 전용 스타일
  },
  gradeBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#2c1810', // 먹색 (진한 갈색)
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10, // 다른 요소들보다 위에 표시
  },
  gradeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bookmarkIcon: {
    position: 'absolute',
    top: 50, // 급수 배지 아래
    right: 15,
    backgroundColor: 'rgba(248, 246, 242, 0.3)', // 연한 배경
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5, // 더 높은 elevation
    zIndex: 20, // 다른 요소들보다 위에
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkIconInCard: {
    position: 'absolute',
    top: 55, // 급수 배지 아래 (급수 배지 높이 + 마진)
    right: 15,
    backgroundColor: 'rgba(248, 246, 242, 0.3)', // 연한 배경
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9, // 급수 배지보다는 낮지만 카드 내용보다는 높게
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 90,
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
    fontSize: 18,
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
    fontWeight: '500',
    lineHeight: 16,
    height: 16, // 고정 높이
  },
  swipeIndicator: {
    position: 'absolute',
    bottom: 20,
    fontSize: 12,
    color: '#999',
    height: 16, // 고정 높이
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftSwipeIndicator: {
    left: 20,
  },
  rightSwipeIndicator: {
    right: 20,
  },
  swipeIndicatorText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16, // 고정 라인 높이로 일관된 정렬
    height: 16, // 고정 높이
  },
});
