import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { useAppStore } from '@/src/stores/useAppStore';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function ExploreScreen() {
  const {
    cardStack,
    studiedCardIds,
    savedCardIds,
    selectedGrade,
    getTotalLearned,
    getFavoriteCount,
    getDbStatistics,
  } = useAppStore();

  const [dbStats, setDbStats] = useState<any>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getDbStatistics();
        setDbStats(stats);
      } catch (error) {
        console.error('통계 로딩 실패:', error);
      }
    };

    loadStats();
  }, [getDbStatistics]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.title}>
          📊 학습 통계
        </ThemedText>

        {/* 현재 세션 통계 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            현재 세션
          </ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statNumber}>
                {selectedGrade}급
              </ThemedText>
              <ThemedText style={styles.statLabel}>현재 급수</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statNumber}>
                {cardStack.length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>총 카드</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statNumber}>
                {studiedCardIds.length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>학습 완료</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statNumber}>
                {savedCardIds.length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>저장됨</ThemedText>
            </View>
          </View>
        </View>

        {/* 전체 진도 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            전체 진도
          </ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statNumber}>
                {getTotalLearned()}
              </ThemedText>
              <ThemedText style={styles.statLabel}>총 학습</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statNumber}>
                {getFavoriteCount()}
              </ThemedText>
              <ThemedText style={styles.statLabel}>즐겨찾기</ThemedText>
            </View>
          </View>
        </View>

        {/* 급수별 통계 */}
        {dbStats && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              급수별 단어 수
            </ThemedText>
            <View style={styles.gradeStats}>
              {Object.entries(dbStats)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([grade, stats]: [string, any]) => (
                  <View key={grade} style={styles.gradeCard}>
                    <ThemedText style={styles.gradeNumber}>
                      {grade}급
                    </ThemedText>
                    <ThemedText style={styles.gradeCount}>
                      {stats.total}개 단어
                    </ThemedText>
                    {stats.memorized > 0 && (
                      <ThemedText style={styles.gradeMemorized}>
                        ({stats.memorized}개 암기)
                      </ThemedText>
                    )}
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* 학습 팁 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            💡 학습 팁
          </ThemedText>
          <ThemedText style={styles.tipText}>
            • 👈 왼쪽 스와이프: 학습 완료 표시{'\n'}• 👉 오른쪽 스와이프: 나중에
            다시 보기{'\n'}• 🔄 카드 탭: 뒷면 확인 (발음, 뜻){'\n'}• 📱 매일
            조금씩 꾸준히 학습하세요!
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 28,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    marginBottom: 15,
    fontSize: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 15,
    minWidth: '45%',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 5,
  },
  gradeStats: {
    gap: 10,
  },
  gradeCard: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gradeNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  gradeCount: {
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },
  gradeMemorized: {
    fontSize: 12,
    opacity: 0.7,
    color: '#34C759',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 15,
    borderRadius: 12,
  },
});
