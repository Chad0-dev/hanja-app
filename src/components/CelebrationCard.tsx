import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppColors } from '../constants/AppColors';
import { useGradeSelection } from '../hooks/useGradeSelection';
import { useAppStore } from '../stores/useAppStore';
import { GradeSelector } from './GradeSelector';

const { width: screenWidth } = Dimensions.get('window');

export const CelebrationCard: React.FC = () => {
  const selectedGrades = useAppStore(state => state.selectedGrades);
  const {
    isGradeSelectorVisible,
    showGradeSelection,
    closeGradeSelection,
    handleGradeChange,
    handleGradeConfirm,
  } = useGradeSelection();

  // 현재 선택된 급수들을 문자열로 표시
  const gradeText =
    selectedGrades.length > 0 ? selectedGrades.join(', ') : '선택된 급수';

  return (
    <>
      <View style={styles.card}>
        <View style={styles.content}>
          {/* 축하 이모지 */}
          <Text style={styles.celebrationEmoji}>🎉</Text>

          {/* 축하 메시지 */}
          <Text style={styles.congratsTitle}>축하합니다!</Text>

          {/* 완료 메시지 */}
          <Text style={styles.completionMessage}>
            {gradeText}의 모든 단어를{'\n'}완료하셨습니다!
          </Text>

          {/* 다음 단계 안내 */}
          <Text style={styles.nextStepMessage}>다음 급수로 도전해보세요!</Text>

          {/* 급수 선택 버튼 */}
          <TouchableOpacity
            style={styles.selectGradeButton}
            onPress={showGradeSelection}
            activeOpacity={0.8}
          >
            <Text style={styles.selectGradeButtonText}>급수 선택하기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 급수 선택 모달 */}
      <GradeSelector
        visible={isGradeSelectorVisible}
        selectedGrades={selectedGrades}
        onGradeChange={handleGradeChange}
        onClose={closeGradeSelection}
        onConfirm={handleGradeConfirm}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 300,
    height: 400,
    backgroundColor: AppColors.primary, // 한지색 배경
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.beige, // 베이지 테두리
    shadowColor: AppColors.shadow, // 먹색 그림자
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15, // 그림자 약간 연하게
    shadowRadius: 12,
    elevation: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28, // 패딩 약간 줄임
  },
  celebrationEmoji: {
    fontSize: 80, // 이모지 크기 증가 (64 → 80)
    marginBottom: 20, // 간격 약간 줄임
  },
  congratsTitle: {
    fontSize: 22, // 텍스트 크기 줄임 (28 → 22)
    fontWeight: 'bold',
    color: AppColors.ink, // 먹색
    marginBottom: 12, // 간격 줄임
    textAlign: 'center',
  },
  completionMessage: {
    fontSize: 16, // 텍스트 크기 줄임 (18 → 16)
    color: AppColors.inkLight, // 연한 먹색
    textAlign: 'center',
    lineHeight: 22, // 줄 간격 줄임
    marginBottom: 16, // 간격 줄임
  },
  nextStepMessage: {
    fontSize: 14, // 텍스트 크기 줄임 (16 → 14)
    color: AppColors.inkLight, // 연한 먹색
    textAlign: 'center',
    marginBottom: 28, // 간격 줄임
  },
  selectGradeButton: {
    backgroundColor: AppColors.brown, // 갈색 배경
    paddingHorizontal: 28, // 패딩 약간 줄임
    paddingVertical: 14, // 패딩 약간 줄임
    borderRadius: 20, // 둥근 정도 약간 줄임
    borderWidth: 1,
    borderColor: AppColors.brownDark, // 진한 갈색 테두리
    shadowColor: AppColors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2, // 그림자 약간 연하게
    shadowRadius: 6,
    elevation: 6,
  },
  selectGradeButtonText: {
    color: AppColors.primary, // 한지색 텍스트
    fontSize: 15, // 텍스트 크기 약간 줄임 (16 → 15)
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
