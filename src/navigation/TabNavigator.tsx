import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TabParamList } from '../types';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/theme';

const Tab = createBottomTabNavigator<TabParamList>();

interface TabIconProps {
  name: string;
  focused: boolean;
  color: string;
  size: number;
}

const TabIcon: React.FC<TabIconProps> = ({ name, focused, color, size }) => (
  <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
    <Icon name={name} size={size} color={color} />
  </View>
);

const tabStyles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  iconWrapActive: {
    backgroundColor: Colors.water10,
  },
});

export const TabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: Colors.surface,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        paddingBottom: 4,
        paddingTop: 4,
        height: 60,
      },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textTertiary,
      tabBarLabelStyle: {
        ...Typography.caption,
        fontWeight: '500',
        marginTop: 0,
      },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ focused, color, size }) => (
          <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{
        tabBarLabel: 'History',
        tabBarIcon: ({ focused, color, size }) => (
          <TabIcon name={focused ? 'chart-bar' : 'chart-bar'} focused={focused} color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        tabBarLabel: 'Settings',
        tabBarIcon: ({ focused, color, size }) => (
          <TabIcon name={focused ? 'cog' : 'cog-outline'} focused={focused} color={color} size={size} />
        ),
      }}
    />
  </Tab.Navigator>
);
