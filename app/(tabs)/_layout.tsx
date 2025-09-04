import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, TouchableOpacity } from 'react-native';

import { IconSymbol } from '@/src/components/ui/IconSymbol';
import TabBarBackground from '@/src/components/ui/TabBarBackground';
import { Colors } from '@/src/constants/Colors';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import { useAppStore } from '@/src/stores/useAppStore';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { canGoBack, goBackToPreviousCard, isLeftHanded } = useAppStore();

  const handleUndoPress = () => {
    if (canGoBack) {
      goBackToPreviousCard();
      // 홈 탭으로 이동
      router.push('/(tabs)');
    }
  };

  // 왼손잡이 모드에 따라 탭 순서 결정
  const renderTabs = () => {
    const exploreTab = (
      <Tabs.Screen
        key="explore"
        name="explore"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={32} name="chart.bar.fill" color={color} />
          ),
        }}
      />
    );

    const homeTab = (
      <Tabs.Screen
        key="index"
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={32} name="house.fill" color={color} />
          ),
        }}
      />
    );

    const undoTab = (
      <Tabs.Screen
        key="undo"
        name="undo"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={32}
              name="arrow.uturn.left"
              color={canGoBack ? color : '#ccc'}
            />
          ),
          tabBarButton: props => (
            <TouchableOpacity
              style={[props.style, { opacity: canGoBack ? 1 : 0.5 }]}
              onPress={handleUndoPress}
              disabled={!canGoBack}
            >
              {props.children}
            </TouchableOpacity>
          ),
        }}
      />
    );

    // 왼손잡이 모드: 뒤로가기 - 홈 - 학습정보
    // 오른손잡이 모드: 학습정보 - 홈 - 뒤로가기
    return isLeftHanded
      ? [undoTab, homeTab, exploreTab]
      : [exploreTab, homeTab, undoTab];
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
            paddingTop: 10,
          },
          default: {
            paddingTop: 10,
          },
        }),
      }}
    >
      {renderTabs()}

      {/* 숨겨진 설정 탭 - 하단 네비게이션에는 표시되지 않음 */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // 하단 탭바에서 숨김
          title: '',
        }}
      />

      {/* 숨겨진 단어장 탭 - 하단 네비게이션에는 표시되지 않음 */}
      <Tabs.Screen
        name="wordbook"
        options={{
          href: null, // 하단 탭바에서 숨김
          title: '',
        }}
      />
    </Tabs>
  );
}
