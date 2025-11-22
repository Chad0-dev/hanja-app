import {
  AdBannerSafe,
  CardDeck,
  DragonCharacter,
  HamburgerMenu,
  LearningProgress,
  getAdUnitId,
  loadInterstitialAd,
  showInterstitialAd,
} from '@/src/components';
import { useAppStore } from '@/src/stores/useAppStore';
import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const [shouldPlayReverse, setShouldPlayReverse] = React.useState(false);
  const [reverseDirection, setReverseDirection] = React.useState<
    'left' | 'right'
  >('right');

  const [forceUpdateDragon, setForceUpdateDragon] = useState(0); // 드래곤 강제 업데이트용

  // Zustand 스토어에서 상태와 액션들 가져오기
  const {
    currentCard,
    cardStack,
    currentCardIndex,
    isLoading,
    studiedCardIds,
    savedCardIds,
    swipeCount,
    isAdsRemoved,
    initializeCardStack,
    swipeLeft,
    swipeRight,
    handleSwipeToRelatedWord, // 새로운 연관단어 스와이프 함수
    setReverseAnimationTrigger,
    incrementSwipeCount,
  } = useAppStore();

  // 역방향 애니메이션 트리거 콜백 설정 (스와이프 방향 포함)
  useEffect(() => {
    setReverseAnimationTrigger((direction: 'left' | 'right') => {
      setReverseDirection(direction);
      setShouldPlayReverse(true);
    });
  }, [setReverseAnimationTrigger]);

  useEffect(() => {
    loadInterstitialAd();
  }, []);

  // 현재 카드부터 시작하는 카드 배열 생성 (CardDeck이 변화를 감지할 수 있도록)
  // 성능 최적화: 최대 3장만 생성 (CardDeck에서 2장만 사용하지만 여유분 포함)
  const displayCards = React.useMemo(() => {
    if (cardStack.length === 0) {
      return [];
    }

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
   * 왼쪽 스와이프 핸들러 (학습 완료 + 연관단어)
   */
  const handleSwipeLeft = (card: any) => {
    // ★★★★★ 새로운 연관단어 로직 ★★★★★
    // 현재 카드의 첫 번째 한자와 연관된 단어를 찾아서 다음 카드로 설정

    // 🐉 스와이프할 때마다 바로 드래곤 변경 (강제 업데이트)
    setForceUpdateDragon(prev => prev + 1);

    // 📊 스와이프 카운터 증가
    incrementSwipeCount();

    setTimeout(async () => {
      if (currentCard) {
        handleSwipeToRelatedWord(currentCard, 'left');

        // 📱 15번 스와이프마다 전면 광고 표시 (광고 제거가 비활성화된 경우에만)
        if (!isAdsRemoved && (swipeCount + 1) % 15 === 0) {
          console.log(`📱 ${swipeCount + 1}번째 스와이프 - 전면 광고 표시`);
          try {
            await showInterstitialAd();
          } catch (error) {
            console.error('📱 전면 광고 표시 실패:', error);
          }
        } else if (isAdsRemoved) {
          console.log(`🛒 광고 제거 활성화됨 - 전면 광고 건너뜀`);
        }
      } else {
        console.warn('⚠️ currentCard가 null입니다 - Left 스와이프 무시');
      }
    }, 30);
  };

  /**
   * 오른쪽 스와이프 핸들러 (저장 + 연관단어)
   */
  const handleSwipeRight = (card: any) => {
    // ★★★★★ 새로운 연관단어 로직 ★★★★★
    // 현재 카드의 마지막 한자와 연관된 단어를 찾아서 다음 카드로 설정

    // 🐉 스와이프할 때마다 바로 드래곤 변경 (강제 업데이트)
    setForceUpdateDragon(prev => prev + 1);

    // 📊 스와이프 카운터 증가
    incrementSwipeCount();

    setTimeout(async () => {
      if (currentCard) {
        handleSwipeToRelatedWord(currentCard, 'right');

        // 📱 15번 스와이프마다 전면 광고 표시 (광고 제거가 비활성화된 경우에만)
        if (!isAdsRemoved && (swipeCount + 1) % 15 === 0) {
          console.log(`📱 ${swipeCount + 1}번째 스와이프 - 전면 광고 표시`);
          try {
            await showInterstitialAd();
          } catch (error) {
            console.error('📱 전면 광고 표시 실패:', error);
          }
        } else if (isAdsRemoved) {
          console.log(`🛒 광고 제거 활성화됨 - 전면 광고 건너뜀`);
        }
      } else {
        console.warn('⚠️ currentCard가 null입니다 - Right 스와이프 무시');
      }
    }, 30);
  };

  // 로딩 중이거나 카드가 없을 때는 로딩 화면 표시
  return (
    <ImageBackground
      source={require('@/assets/images/backgraund1.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* 햄버거 메뉴 */}
      <HamburgerMenu />

      {/* 학습 현황 표시 */}
      <LearningProgress />

      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {isLoading ? (
            // 로딩 중일 때만 로딩 텍스트 표시
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
                showSwipeIndicators
              />

              {/* Dragon 캐릭터 - 카드 변화에 따라 변함 */}
              <DragonCharacter
                cardIndex={currentCardIndex + forceUpdateDragon} // 강제 업데이트 추가
                style={styles.dragonCharacter}
              />

              {/* 디버깅 정보 (개발 중에만 표시) */}
              {__DEV__ && (
                <Text style={styles.debugInfo}>
                  스택: {cardStack.length}장 | 현재: {currentCardIndex + 1}/
                  {cardStack.length} | 학습: {studiedCardIds?.length || 0}장 |
                  저장: {savedCardIds?.length || 0}장 | 스와이프: {swipeCount}회
                </Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* 하단 광고 배너 - 안전한 AdMob 배너 (광고 제거가 비활성화된 경우에만) */}
      {!isAdsRemoved && <AdBannerSafe adUnitId={getAdUnitId('banner')} />}
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
