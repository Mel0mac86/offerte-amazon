import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DealsScreen } from '@/screens/DealsScreen';
import { WatchlistScreen } from '@/screens/WatchlistScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { colors } from '@/theme';
import { useApp } from '@/context/AppContext';

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    border: colors.border,
    primary: colors.accent,
    text: colors.text,
  },
};

function tabIcon(emoji: string) {
  return ({ color }: { color: string }) => (
    <Text style={{ fontSize: 20, color, opacity: color === colors.accent ? 1 : 0.6 }}>{emoji}</Text>
  );
}

export function RootNavigator() {
  const { watchlist } = useApp();
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        }}
      >
        <Tab.Screen
          name="Offerte"
          component={DealsScreen}
          options={{ tabBarIcon: tabIcon('🏷️') }}
        />
        <Tab.Screen
          name="Preferiti"
          component={WatchlistScreen}
          options={{
            tabBarIcon: tabIcon('★'),
            tabBarBadge: watchlist.length > 0 ? watchlist.length : undefined,
          }}
        />
        <Tab.Screen
          name="Impostazioni"
          component={SettingsScreen}
          options={{ tabBarIcon: tabIcon('⚙️') }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
