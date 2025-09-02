import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppStore } from '../stores/useAppStore';
import { GradeSelector } from './GradeSelector';

const { width: screenWidth } = Dimensions.get('window');

interface MenuItem {
  id: string;
  title: string;
}

const menuItems: MenuItem[] = [
  { id: 'grade-selection', title: '급수 선택' },
  { id: 'hanja-quiz', title: '한자 문제' },
  { id: 'word-book', title: '단어장' },
  { id: 'settings', title: '설정' },
  { id: 'help', title: '도움말' },
];

export const HamburgerMenu: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isGradeSelectorVisible, setIsGradeSelectorVisible] = useState(false);
  const router = useRouter();
  const {
    selectedGrade,
    selectedGrades,
    setSelectedGrade,
    setSelectedGrades,
    initializeCardStack,
  } = useAppStore();

  const openMenu = () => {
    setIsVisible(true);
  };

  const closeMenu = () => {
    setIsVisible(false);
  };

  const handleMenuItemPress = (item: MenuItem) => {
    console.log(`메뉴 선택: ${item.title}`);

    if (item.id === 'grade-selection') {
      // 새로운 다중 급수 선택 UI 표시
      setIsGradeSelectorVisible(true);
    } else if (item.id === 'settings') {
      // 설정 페이지로 이동
      router.push('/(tabs)/settings');
    } else {
      // 다른 메뉴 아이템들
      Alert.alert('알림', `${item.title} 기능은 준비 중입니다.`);
    }

    closeMenu();
  };

  const showGradeSelection = () => {
    const grades = [8, 7, 6, 5, 4, 3];
    const gradeButtons = grades.map(grade => ({
      text: `${grade}급`,
      onPress: () => selectGrade(grade),
    }));

    gradeButtons.push({ text: '취소', onPress: async () => {} });

    Alert.alert(
      '급수 선택',
      `현재 급수: ${selectedGrade}급\n학습할 급수를 선택하세요.`,
      gradeButtons
    );
  };

  const selectGrade = async (grade: number) => {
    try {
      console.log(`${grade}급으로 변경 중...`);
      setSelectedGrade(grade as any);
      await initializeCardStack();
      Alert.alert('완료', `${grade}급 한자 학습으로 변경되었습니다.`);
    } catch (error) {
      console.error('급수 변경 실패:', error);
      Alert.alert('오류', '급수 변경에 실패했습니다.');
    }
  };

  // 다중 급수 선택 핸들러
  const handleGradeChange = (grades: number[]) => {
    console.log(`다중 급수 변경: ${grades.join(', ')}급`);
    setSelectedGrades(grades as any[]);
  };

  const handleGradeConfirm = async () => {
    try {
      console.log('다중 급수 적용 중...');
      await initializeCardStack();
      const gradeText =
        selectedGrades.length > 1
          ? `${selectedGrades.join(', ')}급 (다중 선택)`
          : `${selectedGrades[0]}급`;
      console.log(`완료: ${gradeText} 한자 학습으로 변경되었습니다.`);
    } catch (error) {
      console.error('다중 급수 변경 실패:', error);
      Alert.alert('오류', '급수 변경에 실패했습니다.');
    }
  };

  return (
    <>
      {/* 햄버거 메뉴 버튼 */}
      <TouchableOpacity
        style={styles.hamburgerButton}
        onPress={openMenu}
        activeOpacity={0.7}
      >
        <View style={styles.hamburgerLine} />
        <View style={styles.hamburgerLine} />
        <View style={styles.hamburgerLine} />
      </TouchableOpacity>

      {/* 메뉴 팝업 모달 */}
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        {/* 배경 오버레이 */}
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeMenu}
        />

        {/* 메뉴 팝업 - 햄버거 버튼 근처에 드롭다운 */}
        <View style={styles.menuPopup}>
          {/* 화살표 */}
          <View style={styles.arrow} />

          <Text style={styles.menuTitle}>메뉴</Text>

          {/* 메뉴 아이템들 */}
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem,
              ]}
              onPress={() => handleMenuItemPress(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.menuItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* 다중 급수 선택 모달 */}
      <GradeSelector
        visible={isGradeSelectorVisible}
        onClose={() => setIsGradeSelectorVisible(false)}
        selectedGrades={selectedGrades}
        onGradeChange={handleGradeChange}
        onConfirm={handleGradeConfirm}
      />
    </>
  );
};

const styles = StyleSheet.create({
  // 햄버거 버튼
  hamburgerButton: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 50,
    right: 20,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 246, 242, 0.95)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 1000,
  },
  hamburgerLine: {
    width: 22,
    height: 2.5,
    backgroundColor: '#4A4A4A',
    marginVertical: 2.5,
    borderRadius: 1.5,
  },

  // 배경 오버레이
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  // 메뉴 팝업 - 햄버거 버튼 근처에 위치
  menuPopup: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 65 : 100,
    right: 20,
    backgroundColor: '#f8f6f2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 0,
    minWidth: 160,
    maxWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },

  // 드롭다운 화살표
  arrow: {
    position: 'absolute',
    top: -6,
    right: 24,
    width: 12,
    height: 12,
    backgroundColor: '#f8f6f2',
    transform: [{ rotate: '45deg' }],
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },

  // 메뉴 제목
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2c2c',
    textAlign: 'center',
    marginBottom: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e6e3',
  },

  // 메뉴 아이템
  menuItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0ede8',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'left',
  },
});
