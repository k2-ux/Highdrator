import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import notifee, { EventType } from '@notifee/react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Colors } from './src/constants/colors';
import { handleNotificationBackground } from './src/utils/notifications';
import { useStore } from './src/store/useStore';

function AppContent(): React.JSX.Element {
  const syncLogsFromStorage = useStore((s) => s.syncLogsFromStorage);

  useEffect(() => {
    // Sync any water logs added via background notification actions
    syncLogsFromStorage();

    // Handle foreground notification events
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      await handleNotificationBackground(type, detail);
      if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'done') {
        await syncLogsFromStorage();
      }
    });

    return () => { unsubscribe(); };
  }, [syncLogsFromStorage]);

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryDark}
        translucent={false}
      />
      <AppNavigator />
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
