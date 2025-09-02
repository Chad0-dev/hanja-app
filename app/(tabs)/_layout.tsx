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
  const { canGoBack, goBackToPreviousCard } = useAppStore();

  const handleUndoPress = () => {
    if (canGoBack) {
      goBackToPreviousCard();
      // 홈 탭으로 이동
      router.push('/(tabs)');
    }
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
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="undo"
        options={{
          title: '뒤로가기',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
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
    </Tabs>
  );
}
