import { AdBannerMockup } from '@/src/components';
import React from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useColorScheme } from '../../src/hooks/useColorScheme';
import { useAppStore } from '../../src/stores/useAppStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const { isDarkMode, setDarkMode, isLeftHanded, setLeftHanded } =
    useAppStore();

  return (
    <ImageBackground
      source={require('../../assets/images/backgraund2.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* 족자 스타일 설정 카드 */}
        <View style={styles.scrollCard}>
          <Text style={styles.cardTitle}>설정</Text>

          <View style={styles.settingSection}>
            {/* 다크/라이트 모드 토글 */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>다크 모드</Text>
                <Text style={styles.settingDescription}>
                  어두운 테마로 변경 (준비 중)
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#d4d4d8', true: '#3b82f6' }}
                thumbColor={isDarkMode ? '#ffffff' : '#ffffff'}
                ios_backgroundColor="#d4d4d8"
                disabled={true}
              />
            </View>

            {/* 구분선 */}
            <View style={styles.divider} />

            {/* 왼손/오른손 토글 */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>왼손잡이 모드</Text>
                <Text style={styles.settingDescription}>
                  네비게이션 버튼 위치 조정
                </Text>
              </View>
              <Switch
                value={isLeftHanded}
                onValueChange={setLeftHanded}
                trackColor={{ false: '#d4d4d8', true: '#10b981' }}
                thumbColor={isLeftHanded ? '#ffffff' : '#ffffff'}
                ios_backgroundColor="#d4d4d8"
              />
            </View>
          </View>

          <Text style={styles.tipText}>설정은 자동으로 저장됩니다</Text>
        </View>
      </View>

      {/* 하단 배너 광고 목업 */}
      <AdBannerMockup />
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
