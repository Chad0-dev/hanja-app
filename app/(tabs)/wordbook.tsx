import { AdBannerMockup } from '@/src/components';
import { AppColors } from '@/src/constants/AppColors';
import { wordData } from '@/src/data/wordData';
import { useAppStore } from '@/src/stores/useAppStore';
import { HanjaCharacter, HanjaGrade, HanjaWordCard } from '@/src/types';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 80) / 4;

type TabType = 'characters' | 'words';

export default function WordbookScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [selectedGrade, setSelectedGrade] = useState<HanjaGrade>('8급');
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [words, setWords] = useState<HanjaWordCard[]>([]);
  const [characters, setCharacters] = useState<HanjaCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Zustand 스토어에서 즐겨찾기 상태와 액션들 가져오기
  const {
    favoriteCharacters,
    favoriteWords,
    toggleFavoriteCharacter,
    toggleFavoriteWord,
    isFavoriteCharacter,
    isFavoriteWord,
  } = useAppStore();

  const grades: HanjaGrade[] = ['8급', '7급', '6급', '5급', '4급', '3급'];

  // 급수별 데이터 로드
  const loadData = async (grade: HanjaGrade) => {
    setLoading(true);
    try {
      // 직접 데이터에서 해당 급수 필터링
      const wordsData = wordData.filter(word => word.grade === grade);

      setWords(wordsData);

      // 단어들에서 한자 추출 (중복 제거)
      const charactersMap = new Map<string, HanjaCharacter>();
      wordsData.forEach(word => {
        word.characters.forEach(char => {
          if (!charactersMap.has(char.character)) {
            charactersMap.set(char.character, char);
          }
        });
      });

      const extractedCharacters = Array.from(charactersMap.values());
      // 한자를 가나다 순(pronunciation 기준)으로 정렬
      extractedCharacters.sort((a, b) =>
        a.pronunciation.localeCompare(b.pronunciation, 'ko')
      );
      setCharacters(extractedCharacters);
    } catch (error) {
      // 데이터 로드 실패 시 빈 배열로 설정
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedGrade);
  }, [selectedGrade]);

  // 즐겨찾기 토글 (탭에 따라 다른 함수 호출)
  const toggleFavorite = (id: string) => {
    if (activeTab === 'characters') {
      toggleFavoriteCharacter(id);
    } else {
      toggleFavoriteWord(id);
    }
  };

  const renderCharacterCard = ({ item }: { item: HanjaCharacter }) => {
    const isFavorite = isFavoriteCharacter(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isFavorite ? styles.favoriteCard : styles.normalCard,
        ]}
        onPress={() => toggleFavorite(item.id)}
      >
        <Text style={[styles.cardCharacter, isFavorite && styles.favoriteText]}>
          {item.character}
        </Text>
        <Text
          style={[styles.cardMeaning, isFavorite && styles.favoriteSubText]}
          numberOfLines={1}
        >
          {item.meaning} {item.pronunciation}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderWordCard = ({ item }: { item: HanjaWordCard }) => {
    const isFavorite = isFavoriteWord(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isFavorite ? styles.favoriteCard : styles.normalCard,
        ]}
        onPress={() => toggleFavorite(item.id)}
      >
        <Text
          style={[
            styles.cardWord,
            item.word.length >= 3 && styles.cardWordLong,
            isFavorite && styles.favoriteText,
          ]}
        >
          {item.word}
        </Text>
        <Text
          style={[
            styles.cardPronunciation,
            isFavorite && styles.favoriteSubText,
          ]}
        >
          {item.pronunciation}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={require('@/assets/images/backgraund1.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* 탭 선택 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'characters' && styles.activeTab]}
            onPress={() => setActiveTab('characters')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'characters' && styles.activeTabText,
              ]}
            >
              한자
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'words' && styles.activeTab]}
            onPress={() => setActiveTab('words')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'words' && styles.activeTabText,
              ]}
            >
              단어
            </Text>
          </TouchableOpacity>
        </View>

        {/* 급수 선택 드롭다운과 검색창 */}
        <View style={styles.gradeSection}>
          <TouchableOpacity
            style={styles.gradeDropdownButton}
            onPress={() => setShowGradeDropdown(!showGradeDropdown)}
          >
            <Text style={styles.gradeDropdownText}>{selectedGrade} ▼</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.searchInput}
            placeholder="檢索"
            placeholderTextColor={AppColors.inkLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {showGradeDropdown && (
            <View style={styles.gradeDropdown}>
              {grades.map(grade => (
                <TouchableOpacity
                  key={grade}
                  style={[
                    styles.gradeOption,
                    selectedGrade === grade && styles.selectedGradeOption,
                  ]}
                  onPress={() => {
                    setSelectedGrade(grade);
                    setShowGradeDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.gradeOptionText,
                      selectedGrade === grade && styles.selectedGradeOptionText,
                    ]}
                  >
                    {grade}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 카드 그리드 */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
          </View>
        ) : (activeTab === 'characters' ? characters : words).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'characters'
                ? '한자가 없습니다'
                : '단어가 없습니다'}
            </Text>
            <Text style={styles.emptySubText}>
              데이터베이스를 확인하거나 앱을 재시작해보세요
            </Text>
          </View>
        ) : activeTab === 'characters' ? (
          <FlatList
            data={characters.filter(item => {
              if (!searchQuery) return true;
              const query = searchQuery.toLowerCase();
              return (
                item.character.includes(query) ||
                item.pronunciation.toLowerCase().includes(query) ||
                item.meaning.toLowerCase().includes(query)
              );
            })}
            renderItem={renderCharacterCard}
            keyExtractor={item => item.id}
            numColumns={4}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={() => loadData(selectedGrade)}
          />
        ) : (
          <FlatList
            data={words.filter(item => {
              if (!searchQuery) return true;
              const query = searchQuery.toLowerCase();
              return (
                item.word.includes(query) ||
                item.pronunciation.toLowerCase().includes(query) ||
                item.meaning.toLowerCase().includes(query)
              );
            })}
            renderItem={renderWordCard}
            keyExtractor={item => item.id}
            numColumns={4}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={() => loadData(selectedGrade)}
          />
        )}
      </View>
      
      {/* 하단 배너 광고 목업 */}
      <AdBannerMockup />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: AppColors.primaryLight,
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: AppColors.beige,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: AppColors.brown,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.inkLight,
  },
  activeTabText: {
    color: AppColors.primary,
  },
  gradeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    marginBottom: 15,
  },
  gradeDropdownButton: {
    backgroundColor: AppColors.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.beige,
    alignSelf: 'flex-start',
  },
  gradeDropdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.ink,
  },
  gradeDropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    backgroundColor: AppColors.primary,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: AppColors.beige,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  gradeOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.beigeLight,
  },
  selectedGradeOption: {
    backgroundColor: AppColors.beigeLight,
  },
  gradeOptionText: {
    fontSize: 16,
    color: AppColors.inkLight,
  },
  selectedGradeOptionText: {
    fontWeight: '600',
    color: AppColors.ink,
  },
  statsContainer: {
    marginBottom: 15,
  },
  statsText: {
    fontSize: 14,
    color: AppColors.inkLight,
    textAlign: 'center',
  },
  gridContainer: {
    paddingBottom: 100,
    paddingHorizontal: 8,
  },
  card: {
    width: CARD_WIDTH,
    height: 100,
    margin: 4,
    borderRadius: 15,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  normalCard: {
    backgroundColor: AppColors.primaryDark,
    borderColor: AppColors.beige,
    opacity: 0.7,
  },
  favoriteCard: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.brown,
    opacity: 1,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  cardCharacter: {
    fontSize: 32,
    fontWeight: 'bold',
    color: AppColors.inkLight,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardPronunciation: {
    fontSize: 12,
    color: AppColors.inkLight,
    marginBottom: 2,
  },
  cardMeaning: {
    fontSize: 11,
    color: AppColors.inkLight,
    textAlign: 'center',
    lineHeight: 16,
  },

  cardWord: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.inkLight,
    marginBottom: 10,
    textAlign: 'center',
  },
  cardWordLong: {
    fontSize: 18,
  },
  favoriteText: {
    color: AppColors.ink,
  },
  favoriteSubText: {
    color: AppColors.inkLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.inkLight,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: AppColors.inkLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: AppColors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.beige,
    fontSize: 16,
    color: AppColors.ink,
  },
});
