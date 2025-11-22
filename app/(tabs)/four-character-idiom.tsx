import {
  AdBannerSafe,
  CardDeck,
  DragonCharacter,
  HamburgerMenu,
  getAdUnitId,
} from '@/src/components';
import { characterData } from '@/src/data/characterData';
import { fourCharacterIdioms } from '@/src/data/fourCharacterIdioms';
import { CardHistoryItem, HanjaCharacter, HanjaWordCard } from '@/src/types';
import { shuffleArray } from '@/src/utils/shuffle';
import { CardHistoryManager, processGoBack } from '@/src/hooks/useCardHistory';
import { useAppStore } from '@/src/stores/useAppStore';
import { GradeSelector } from '@/src/components/GradeSelector';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

const buildCharacterMap = (): Map<string, HanjaCharacter> => {
  const map = new Map<string, HanjaCharacter>();
  characterData.forEach(char => {
    map.set(char.character, char);
  });
  return map;
};

const characterMap = buildCharacterMap();

const convertIdiomsToCards = (): HanjaWordCard[] => {
  return shuffleArray(fourCharacterIdioms).map(idiom => {
    const orderedCharacters = idiom.characters.map((character, index) => {
      const base = characterMap.get(character);
      if (base) {
        return {
          ...base,
          id: `${base.id}_${idiom.id}_${index}`,
        };
      }

      return {
        id: `custom_${idiom.id}_${index}`,
        character,
        pronunciation: '',
        meaning: '',
        strokeCount: 0,
        radical: '',
        radicalName: '',
        radicalStrokes: 0,
      };
    });

    return {
      id: idiom.id,
      word: idiom.word,
      pronunciation: idiom.pronunciation,
      meaning: idiom.meaning,
      grade: idiom.grade,
      isMemorized: false,
      isBookmarked: false,
      characters: orderedCharacters,
      relatedWords: { leftSwipe: [], rightSwipe: [] },
    };
  });
};

const idiomGrades: HanjaGrade[] = ['8급', '7급', '6급', '5급', '4급', '3급'];

export default function FourCharacterIdiomScreen() {
  const bookmarkedIdiomIds = useAppStore(state => state.bookmarkedIdiomIds);
  const idiomCards = useMemo(() => convertIdiomsToCards(), []);
  const [selectedIdiomGrades, setSelectedIdiomGrades] = useState<HanjaGrade[]>([
    '8급',
  ]);
  const activeGrades = useMemo(
    () => (selectedIdiomGrades.length > 0 ? selectedIdiomGrades : ['8급']),
    [selectedIdiomGrades]
  );
  const cardsForGrade = useMemo(
    () => idiomCards.filter(card => activeGrades.includes(card.grade)),
    [idiomCards, activeGrades]
  );
  const [cardStack, setCardStack] = useState<HanjaWordCard[]>([]);
  const [cardHistory, setCardHistory] = useState<CardHistoryItem[]>([]);
  const [swipeCount, setSwipeCount] = useState(0);
  const cardStackRef = useRef(cardStack);
  const [shouldPlayReverse, setShouldPlayReverse] = useState(false);
  const [reverseDirection, setReverseDirection] = useState<'left' | 'right'>(
    'right'
  );
  const [isGradeSelectorVisible, setGradeSelectorVisible] = useState(false);
  const setCustomUndoHandler = useAppStore(state => state.setCustomUndoHandler);
  const setCustomUndoAvailability = useAppStore(
      state => state.setCustomUndoAvailability
    );
  useEffect(() => {
    console.log('[사자성어] 현재 급수', activeGrades.join(', '));
  }, [activeGrades]);

  useEffect(() => {
    cardStackRef.current = cardStack;
  }, [cardStack]);

  useEffect(() => {
    console.log(
      '[사자성어] 급수 변경 시작',
      activeGrades.join(', '),
      '카드 수',
      cardsForGrade.length
    );
    setCardStack(cardsForGrade);
    setCardHistory([]);
    setSwipeCount(0);
  }, [cardsForGrade, activeGrades]);

  const rotateCards = useCallback(
    (direction: 'left' | 'right') => {
      setShouldPlayReverse(false);
      setCardStack(prev => {
        if (prev.length === 0) {
          return prev;
        }

        const [first, ...rest] = prev;

        const isBookmarked = bookmarkedIdiomIds.includes(first.id);
        if (isBookmarked) {
          return rest;
        }

        if (prev.length <= 1) {
          return prev;
        }

        setCardHistory(historyPrev =>
          CardHistoryManager.addToHistory(historyPrev, first, direction, 10)
        );
        return [...rest, first];
      });
      setSwipeCount(prev => prev + 1);
    },
    [bookmarkedIdiomIds]
  );

  const goBackFromIdioms = useCallback(() => {
    setCardHistory(prevHistory => {
      const result = processGoBack(prevHistory, cardStackRef.current);
      if (!result.success) {
        return prevHistory;
      }

      if (result.newCardStack) {
        setCardStack(result.newCardStack);
      } else if (result.previousCard) {
        setCardStack(prevStack => {
          const filtered = prevStack.filter(card => card.id !== result.previousCard!.id);
          return [result.previousCard!, ...filtered];
        });
      }

      if (result.swipeDirection) {
        setReverseDirection(result.swipeDirection);
        setShouldPlayReverse(true);
      }

      setSwipeCount(prev => prev + 1);
      return result.newHistory;
    });
  }, []);

  useEffect(() => {
    setCustomUndoHandler(() => {
      goBackFromIdioms();
    });
    return () => {
      setCustomUndoHandler(null);
      setCustomUndoAvailability(false);
    };
  }, [goBackFromIdioms, setCustomUndoAvailability, setCustomUndoHandler]);

  useEffect(() => {
    setCustomUndoAvailability(cardHistory.length > 0);
  }, [cardHistory.length, setCustomUndoAvailability]);

  const handleSwipeLeft = useCallback(() => {
    rotateCards('left');
  }, [rotateCards]);

  const handleSwipeRight = useCallback(() => {
    rotateCards('right');
  }, [rotateCards]);

  const displayCards = useMemo(
    () => cardStack.slice(0, Math.min(3, cardStack.length)),
    [cardStack]
  );

  const bookmarkedCountForGrade = useMemo(
    () => cardsForGrade.filter(card => bookmarkedIdiomIds.includes(card.id)).length,
    [cardsForGrade, bookmarkedIdiomIds]
  );

  return (
    <ImageBackground
      source={require('@/assets/images/backgraund1.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <HamburgerMenu />

      <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            <Text style={styles.progressBookmarked}>{bookmarkedCountForGrade}</Text>
            <Text style={styles.progressSlash}> / </Text>
            <Text style={styles.progressTotal}>{cardsForGrade.length}</Text>
          </Text>
      </View>

      <View style={styles.overlay}>
        <View style={styles.cardWrapper}>
          <CardDeck
            cards={displayCards}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            maxVisibleCards={3}
            showSwipeIndicators={false}
            meaningTextVariant="compact"
            shouldPlayReverseAnimation={shouldPlayReverse}
            reverseDirection={reverseDirection}
            onReverseAnimationComplete={() => setShouldPlayReverse(false)}
            onGradePress={() => {
              setGradeSelectorVisible(true);
            }}
          />
        </View>

        <DragonCharacter cardIndex={swipeCount} style={styles.dragon} />
      </View>

      <AdBannerSafe adUnitId={getAdUnitId('banner')} />

      <GradeSelector
        visible={isGradeSelectorVisible}
        selectedGrades={selectedIdiomGrades}
        onGradeChange={grades => {
          const next = grades.length > 0 ? grades : ['8급'];
          setSelectedIdiomGrades(next);
        }}
        onConfirm={() => {
          setGradeSelectorVisible(false);
        }}
        onClose={() => setGradeSelectorVisible(false)}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  progressContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  progressText: {
    backgroundColor: '#f8f6f2',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBookmarked: {
    color: '#4CAF50',
  },
  progressSlash: {
    color: '#2c1810',
  },
  progressTotal: {
    color: '#2c1810',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cardWrapper: {
    width: 320,
    height: 420,
    backgroundColor: 'transparent',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragon: {
    marginTop: 32,
  },
});
