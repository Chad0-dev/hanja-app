import { CardDeck, DragonCharacter, HamburgerMenu } from '@/src/components';
import { useAppStore } from '@/src/stores/useAppStore';
import React, { useEffect } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const [shouldPlayReverse, setShouldPlayReverse] = React.useState(false);
  const [reverseDirection, setReverseDirection] = React.useState<
    'left' | 'right'
  >('right');

  // Zustand 스토어에서 상태와 액션들 가져오기
  const {
    currentCard,
    cardStack,
    currentCardIndex,
    isLoading,
    studiedCardIds,
    savedCardIds,
    initializeCardStack,
    swipeLeft,
    swipeRight,
    setReverseAnimationTrigger,
  } = useAppStore();

  // 역방향 애니메이션 트리거 콜백 설정 (스와이프 방향 포함)
  useEffect(() => {
    setReverseAnimationTrigger((direction: 'left' | 'right') => {
      setReverseDirection(direction);
      setShouldPlayReverse(true);
    });
  }, [setReverseAnimationTrigger]);

  // 현재 카드부터 시작하는 카드 배열 생성 (CardDeck이 변화를 감지할 수 있도록)
  // 성능 최적화: 최대 3장만 생성 (CardDeck에서 2장만 사용하지만 여유분 포함)
  const displayCards = React.useMemo(() => {
    if (cardStack.length === 0) return [];

    const maxCards = Math.min(3, cardStack.length);
    const reorderedCards = [];

    for (let i = 0; i < maxCards; i++) {
      const index = (currentCardIndex + i) % cardStack.length;
      reorderedCards.push(cardStack[index]);
    }

    return reorderedCards;
  }, [cardStack, currentCardIndex]);

  /**
   * 컴포넌트 마운트 시 카드 스택 초기화
   */
  useEffect(() => {
    // SQLite 기반 앱 초기화
    const initializeApp = useAppStore.getState().initializeApp;
    initializeApp().catch(error => {
      console.error('❌ 앱 초기화 실패:', error);
      // 폴백으로 기존 방식 사용
      initializeCardStack();
    });
  }, [initializeCardStack]);

  /**
   * 왼쪽 스와이프 핸들러 (거부/다음)
   */
  const handleSwipeLeft = (card: any) => {
    // ★★★★★ 동시에 진행되는 애니메이션 ★★★★★
    // 1번째 카드 사라지는 애니메이션과 2번째 카드 팝업 애니메이션이 동시에 시작
    // 아주 짧은 딜레이로 애니메이션 시작 타이밍 맞춤
    setTimeout(() => {
      swipeLeft();
    }, 30); // 500ms → 30ms (거의 즉시 시작)
  };

  /**
   * 오른쪽 스와이프 핸들러 (학습/저장)
   */
  const handleSwipeRight = (card: any) => {
    // ★★★★★ 동시에 진행되는 애니메이션 ★★★★★
    // 1번째 카드 사라지는 애니메이션과 2번째 카드 팝업 애니메이션이 동시에 시작
    setTimeout(() => {
      swipeRight();
    }, 30); // 500ms → 30ms (거의 즉시 시작)
  };

  // 로딩 중이거나 카드가 없을 때는 로딩 화면 표시
  return (
    <ImageBackground
      source={require('@/assets/images/backgraund.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* 햄버거 메뉴 */}
      <HamburgerMenu />

      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {isLoading || displayCards.length === 0 ? (
            // 로딩 중이거나 카드가 없을 때
            <Text style={styles.loadingText}>
              다음 한자 카드 준비 중...
              {cardStack.length > 0 && (
                <Text style={styles.stackInfo}>
                  {'\n'}(스택에 {cardStack.length}장 대기 중)
                </Text>
              )}
            </Text>
          ) : (
            // 카드가 있을 때
            <>
              <CardDeck
                cards={displayCards}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                maxVisibleCards={3} // 3장 렌더링 (3번째는 투명)
                shouldPlayReverseAnimation={shouldPlayReverse}
                reverseDirection={reverseDirection}
                onReverseAnimationComplete={() => setShouldPlayReverse(false)}
              />

              {/* Dragon 캐릭터 - 카드 변화에 따라 변함 */}
              <DragonCharacter
                cardIndex={currentCardIndex}
                style={styles.dragonCharacter}
              />

              {/* 디버깅 정보 (개발 중에만 표시) */}
              {__DEV__ && (
                <Text style={styles.debugInfo}>
                  스택: {cardStack.length}장 | 현재: {currentCardIndex + 1}/
                  {cardStack.length} | 학습: {studiedCardIds?.length || 0}장 |
                  저장: {savedCardIds?.length || 0}장
                </Text>
              )}
            </>
          )}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // 반투명 오버레이로 텍스트 가독성 향상
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  stackInfo: {
    fontSize: 14,
    color: '#ccc',
    fontWeight: '400',
  },
  debugInfo: {
    position: 'absolute',
    bottom: 50,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  dragonCharacter: {
    marginTop: 30,
    opacity: 0.8,
    alignSelf: 'center',
  },
});
