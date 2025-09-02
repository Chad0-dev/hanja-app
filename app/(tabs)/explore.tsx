import { useAppStore } from '@/src/stores/useAppStore';
import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

export default function ExploreScreen() {
  const { selectedGrade, cardStack } = useAppStore();

  return (
    <ImageBackground
      source={require('@/assets/images/backgraund2.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* 족자 스타일의 카드 */}
          <View style={styles.scrollCard}>
            <Text style={styles.cardTitle}>한자 학습 현황</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>현재 급수</Text>
              <Text style={styles.infoValue}>{selectedGrade}급</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>총 카드 수</Text>
              <Text style={styles.infoValue}>{cardStack.length}장</Text>
            </View>

            <Text style={styles.tipText}>
              매일 꾸준히 한자를 학습하여{'\n'}
              실력을 향상시켜보세요!
            </Text>
          </View>
        </View>
      </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // 반투명 오버레이
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scrollCard: {
    width: 300,
    height: 320, // 400 → 320으로 줄임
    backgroundColor: '#f8f5f0',
    borderRadius: 20,
    padding: 25, // 30 → 25로 줄임
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
    // 족자 느낌의 테두리
    borderWidth: 8,
    borderColor: '#8b4513',
    borderTopWidth: 20,
    borderBottomWidth: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c1810',
    marginBottom: 30, // 40 → 30으로 줄임
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  infoLabel: {
    fontSize: 18,
    color: '#5d4037',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 20,
    color: '#d84315',
    fontWeight: 'bold',
  },
  tipText: {
    fontSize: 16,
    color: '#6d4c41',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 25, // 30 → 25로 줄임
    fontStyle: 'italic',
  },
});
