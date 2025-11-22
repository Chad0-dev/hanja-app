import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { HanjaGrade } from '../types';

interface GradeSelectorProps {
  visible: boolean;
  onClose: () => void;
  selectedGrades: HanjaGrade[];
  onGradeChange: (grades: HanjaGrade[]) => void;
  onConfirm: () => void;
}

const ALL_GRADES: HanjaGrade[] = ['8급', '7급', '6급', '5급', '4급', '3급'];

export const GradeSelector: React.FC<GradeSelectorProps> = ({
  visible,
  onClose,
  selectedGrades,
  onGradeChange,
  onConfirm,
}) => {
  const [tempSelectedGrades, setTempSelectedGrades] = useState<HanjaGrade[]>(
    selectedGrades || []
  );

  useEffect(() => {
    setTempSelectedGrades(selectedGrades || []);
  }, [selectedGrades]);

  const handleGradeToggle = (grade: HanjaGrade) => {
    const newGrades = tempSelectedGrades.includes(grade)
      ? tempSelectedGrades.filter(g => g !== grade)
      : [...tempSelectedGrades, grade]
          .filter(g => g && typeof g === 'string')
          .sort((a, b) => {
            // '8급' -> 8로 변환해서 내림차순 정렬
            const numA = parseInt(a.replace('급', ''));
            const numB = parseInt(b.replace('급', ''));
            return numB - numA;
          });

    setTempSelectedGrades(newGrades);
  };

  const handleConfirm = () => {
    if (tempSelectedGrades.length === 0) {
      Alert.alert('알림', '최소 하나의 급수를 선택해주세요.');
      return;
    }
    onGradeChange(tempSelectedGrades);
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    setTempSelectedGrades(selectedGrades || []); // 원래 상태로 복원
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        {/* 급수 선택 팝업 */}
        <View style={styles.popup}>
          <Text style={styles.title}>학습 급수 선택</Text>

          {/* 안내 문구 */}
          <View style={styles.guideSection}>
            <Text style={styles.guideText}>💡 2개 급수 선택 권장</Text>
          </View>

          {/* 개별 급수 선택 */}
          <View style={styles.gradeSection}>
            <ScrollView
              style={styles.gradeList}
              showsVerticalScrollIndicator={false}
            >
              {ALL_GRADES.map(grade => {
                const isSelected = tempSelectedGrades.includes(grade);
                return (
                  <TouchableOpacity
                    key={grade}
                    style={[
                      styles.gradeItem,
                      isSelected && styles.gradeItemSelected,
                    ]}
                    onPress={() => handleGradeToggle(grade)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.gradeText,
                        isSelected && styles.gradeTextSelected,
                      ]}
                    >
                      {grade}
                    </Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 선택 상태 표시 */}
          <View style={styles.statusSection}>
            <Text style={styles.statusText}>
              선택된 급수:{' '}
              {tempSelectedGrades.length > 0
                ? tempSelectedGrades
                    .filter(grade => grade && typeof grade === 'string')
                    .sort((a, b) => {
                      const numA = parseInt(a.replace('급', ''));
                      const numB = parseInt(b.replace('급', ''));
                      return numB - numA;
                    })
                    .join(', ')
                : '없음'}
            </Text>
          </View>

          {/* 확인/취소 버튼 */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 배경 터치 영역 */}
        <TouchableOpacity
          style={styles.backgroundTouchArea}
          activeOpacity={1}
          onPress={handleCancel}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popup: {
    backgroundColor: '#f8f6f2', // 오프화이트 (앱 메인 색상)
    borderRadius: 20,
    padding: 28,
    width: '90%',
    maxWidth: 380,
    maxHeight: '90%', // 높이 더 증가 (모든 급수 버튼이 보이도록)
    shadowColor: '#2c1810', // 먹색 그림자
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 25,
    borderWidth: 2,
    borderColor: '#e8e6e3', // 오프화이트 계열 테두리
  },
  backgroundTouchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c1810', // 먹색
    textAlign: 'center',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#8b7355', // 갈색 계열
    paddingBottom: 10,
  },
  guideSection: {
    backgroundColor: '#f0ede8', // 오프화이트 계열
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d4d0c7', // 베이지 계열
  },
  guideText: {
    fontSize: 13,
    color: '#5a4f3a', // 갈색 계열
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },

  gradeSection: {
    marginBottom: 16,
  },
  gradeList: {
    maxHeight: 320, // 높이 증가 (6개 급수 모두 보이도록)
  },
  gradeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d4d0c7', // 베이지 계열
    backgroundColor: '#faf9f7', // 연한 오프화이트
  },
  gradeItemSelected: {
    backgroundColor: '#e8e6e3', // 선택된 항목 오프화이트
    borderColor: '#8b7355', // 갈색 계열 테두리
  },
  gradeText: {
    fontSize: 16,
    color: '#2c1810', // 먹색
    fontWeight: '500',
  },
  gradeTextSelected: {
    color: '#2c1810', // 먹색 유지
    fontWeight: 'bold',
  },
  checkmark: {
    fontSize: 16,
    color: '#8b7355', // 갈색 계열
    fontWeight: 'bold',
  },
  statusSection: {
    backgroundColor: '#f0ede8', // 오프화이트 계열
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d4d0c7', // 베이지 계열
  },
  statusText: {
    fontSize: 14,
    color: '#5a4f3a', // 갈색 계열
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonSection: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#faf9f7', // 연한 오프화이트
    borderWidth: 2,
    borderColor: '#d4d0c7', // 베이지 계열
  },
  confirmButton: {
    backgroundColor: '#8b7355', // 갈색 계열 (먹색 계열)
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#5a4f3a', // 갈색 계열
    fontWeight: '500',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#f8f6f2', // 오프화이트
    fontWeight: 'bold',
  },
});
