import { AdBannerSafe, getAdUnitId } from '@/src/components';
import React from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useAppStore } from '../../src/stores/useAppStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function StoreScreen() {
  const { isAdsRemoved, setAdsRemoved } = useAppStore();

  return (
    <ImageBackground
      source={require('../../assets/images/backgraund2.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* 상점 스타일 설정 카드 */}
        <View style={styles.scrollCard}>
          <Text style={styles.cardTitle}>상점</Text>

          <View style={styles.settingSection}>
            {/* 광고 제거 토글 */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>광고 제거</Text>
                <Text style={styles.settingDescription}>
                  모든 광고를 제거하여 더 나은 학습 환경을 제공합니다
                </Text>
              </View>
              <Switch
                value={isAdsRemoved}
                onValueChange={setAdsRemoved}
                trackColor={{ false: '#d4d4d8', true: '#ef4444' }}
                thumbColor={isAdsRemoved ? '#ffffff' : '#ffffff'}
                ios_backgroundColor="#d4d4d8"
                disabled={true}
              />
            </View>
          </View>

          <Text style={styles.tipText}>상점 기능은 준비 중입니다</Text>
        </View>
      </View>

      {/* 하단 광고 배너 - 안전한 AdMob 배너 (광고 제거가 비활성화된 경우에만) */}
      {!isAdsRemoved && <AdBannerSafe adUnitId={getAdUnitId('banner')} />}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scrollCard: {
    backgroundColor: '#f8f6f2',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#8b7355',
    padding: 30,
    marginBottom: 40,
    width: Math.min(350, screenWidth - 40),
    maxHeight: screenHeight * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c2c2c',
    textAlign: 'center',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#d4af37',
    paddingBottom: 15,
  },
  settingSection: {
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 5,
  },
  tipText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },
});
