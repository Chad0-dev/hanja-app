import { useState } from 'react';
import { Alert } from 'react-native';
import { useAppStore } from '../stores/useAppStore';
import { HanjaGrade } from '../types';

export const useGradeSelection = () => {
  const [isGradeSelectorVisible, setIsGradeSelectorVisible] = useState(false);
  const { selectedGrades, setSelectedGrades, initializeCardStack } = useAppStore();

  const showGradeSelection = () => {
    setIsGradeSelectorVisible(true);
  };

  const closeGradeSelection = () => {
    setIsGradeSelectorVisible(false);
  };

  const handleGradeChange = (grades: HanjaGrade[]) => {
    setSelectedGrades(grades);
  };

  const handleGradeConfirm = async () => {
    try {
      await initializeCardStack();
      const gradeText =
        selectedGrades.length > 1
          ? `${selectedGrades.join(', ')} (다중 선택)`
          : `${selectedGrades[0]}`;
      Alert.alert('완료', `${gradeText} 한자 학습으로 변경되었습니다.`);
    } catch (error) {
      console.error('다중 급수 변경 실패:', error);
      Alert.alert('오류', '급수 변경에 실패했습니다.');
    }
  };

  return {
    isGradeSelectorVisible,
    selectedGrades,
    showGradeSelection,
    closeGradeSelection,
    handleGradeChange,
    handleGradeConfirm,
  };
};