import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { ScanScreen } from '../screens/ScanScreen'
import { FindingsScreen } from '../screens/FindingsScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { colors, font } from '../theme'

// lucide-react-native icons
import { Search, ShieldAlert, Settings } from 'lucide-react-native'

const Tab = createBottomTabNavigator()

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: { fontSize: font.sm, fontWeight: '500' },
      }}
    >
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Findings"
        component={FindingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <ShieldAlert size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  )
}
