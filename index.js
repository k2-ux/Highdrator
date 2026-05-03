/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee from '@notifee/react-native';
import { handleNotificationBackground } from './src/utils/notifications';

// Handle notification events when app is in background or terminated
notifee.onBackgroundEvent(async ({ type, detail }) => {
  await handleNotificationBackground(type, detail);
});

AppRegistry.registerComponent(appName, () => App);
