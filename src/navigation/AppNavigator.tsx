import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { TabNavigator } from './TabNavigator';
import { RootStackParamList } from '../types';
import { useStore } from '../store/useStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const hasCompletedOnboarding = useStore((s) => s.hasCompletedOnboarding);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {hasCompletedOnboarding ? (
          <Stack.Screen name="MainTabs" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
