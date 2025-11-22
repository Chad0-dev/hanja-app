import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getWordsByGrade } from '../database/hanjaDB';
import { useAppStore } from '../stores/useAppStore';

interface ProgressData {
  totalWords: number;
  bookmarkedWords: number;
}

let globalRefreshCallback: (() => void) | null = null;

export const LearningProgress: React.FC = () => {
  const { selectedGrade, selectedGrades, isDbInitialized, isLoading } =
    useAppStore();
  const [progressData, setProgressData] = useState<ProgressData>({
    totalWords: 0,
    bookmarkedWords: 0,
  });

  const fetchProgressData = useCallback(async () => {
    if (isLoading || !isDbInitialized) {
      return;
    }

    setTimeout(async () => {
      try {
        const gradesToCheck =
          selectedGrades.length > 0 ? selectedGrades : [selectedGrade];

        let allWords: any[] = [];

        for (const grade of gradesToCheck) {
          const words = await getWordsByGrade(grade);
          allWords = allWords.concat(words);
        }

        const totalWords = allWords.length;
        const bookmarkedWords = allWords.filter(
          word => word.isBookmarked
        ).length;

        setProgressData({
          totalWords,
          bookmarkedWords,
        });

        if (gradesToCheck.length > 1) {
          console.log(
            `📊 학습 현황 업데이트: ${bookmarkedWords}/${totalWords} (급수: ${gradesToCheck.join(', ')})`
          );
        }
      } catch (error) {
        console.error('학습 현황 데이터 조회 실패:', error);
        setProgressData({
          totalWords: 0,
          bookmarkedWords: 0,
        });
      }
    }, 100);
  }, [selectedGrade, selectedGrades, isDbInitialized, isLoading]);

  useEffect(() => {
    if (!isLoading && isDbInitialized) {
      fetchProgressData();
    }
  }, [isLoading, isDbInitialized, fetchProgressData]);

  useFocusEffect(
    useCallback(() => {
      fetchProgressData();
    }, [fetchProgressData])
  );

  useEffect(() => {
    globalRefreshCallback = fetchProgressData;
    return () => {
      globalRefreshCallback = null;
    };
  }, [fetchProgressData]);

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          <Text style={styles.bookmarkedCount}>
            {progressData.bookmarkedWords}
          </Text>
          <Text style={styles.separator}> / </Text>
          <Text style={styles.totalCount}>{progressData.totalWords}</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  progressContainer: {
    backgroundColor: '#f8f6f2',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  bookmarkedCount: {
    color: '#4CAF50',
  },
  separator: {
    color: '#2c1810',
  },
  totalCount: {
    color: '#2c1810',
  },
});

export const refreshLearningProgress = () => {
  if (globalRefreshCallback) {
    globalRefreshCallback();
  }
};
