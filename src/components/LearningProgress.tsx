import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getWordsByGrade } from '../database/hanjaDB';
import { useAppStore } from '../stores/useAppStore';

interface ProgressData {
  totalWords: number;
  bookmarkedWords: number;
}

// 학습 현황 업데이트를 위한 전역 콜백 저장
let globalRefreshCallback: (() => void) | null = null;

export const LearningProgress: React.FC = () => {
  const { selectedGrade, isDbInitialized } = useAppStore();
  const [progressData, setProgressData] = useState<ProgressData>({
    totalWords: 0,
    bookmarkedWords: 0,
  });

  const fetchProgressData = useCallback(async () => {
    // 데이터베이스가 초기화되지 않았으면 데이터 조회하지 않음
    if (!isDbInitialized) {
      console.log('📊 데이터베이스 초기화 대기 중...');
      return;
    }

    try {
      // 현재 선택된 급수의 전체 단어 수
      const allWords = await getWordsByGrade(selectedGrade);
      const totalWords = allWords.length;

      // 북마크된 단어 수 (같은 급수에서)
      const bookmarkedWords = allWords.filter(word => word.isBookmarked).length;

      setProgressData({
        totalWords,
        bookmarkedWords,
      });
    } catch (error) {
      console.error('학습 현황 데이터 조회 실패:', error);
    }
  }, [selectedGrade, isDbInitialized]);

  useEffect(() => {
    fetchProgressData();
  }, [fetchProgressData]);

  // 데이터베이스 초기화 완료 시 자동으로 데이터 새로고침
  useEffect(() => {
    if (isDbInitialized) {
      fetchProgressData();
    }
  }, [isDbInitialized, fetchProgressData]);

  // 페이지 포커스 시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      fetchProgressData();
    }, [fetchProgressData])
  );

  // 전역 콜백 등록
  useEffect(() => {
    globalRefreshCallback = fetchProgressData;

    // 컴포넌트 언마운트 시 콜백 제거
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
    top: 60, // 햄버거 메뉴 아래 위치
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  progressContainer: {
    backgroundColor: '#f8f6f2', // 오프 화이트
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // 아이폰 아일랜드 노치 스타일
    minWidth: 80,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  bookmarkedCount: {
    color: '#4CAF50', // 녹색
  },
  separator: {
    color: '#2c1810', // 먹색
  },
  totalCount: {
    color: '#2c1810', // 먹색
  },
});

// 학습 현황 새로고침 함수 export
export const refreshLearningProgress = () => {
  if (globalRefreshCallback) {
    globalRefreshCallback();
  }
};
