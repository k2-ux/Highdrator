import notifee, {
  AndroidImportance,
  AndroidColor,
  EventType,
  EventDetail,
  TriggerType,
  AndroidVisibility,
  AuthorizationStatus,
} from '@notifee/react-native';
import { Settings } from '../types';
import { getNotificationTimesForDay } from './calculations';
import { appendLogForToday } from './storage';

const CHANNEL_ID = 'highdrator_reminders';
const RESCHEDULE_NOTIFICATION_ID = 'daily_reschedule';

export async function createNotificationChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Hydration Reminders',
    description: 'Reminders to drink water throughout the day',
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [300, 400, 200, 400, 200, 600],
    sound: 'default',
    badge: false,
    lights: true,
    lightColor: AndroidColor.CYAN,
    visibility: AndroidVisibility.PUBLIC,
    bypassDnd: false,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

function buildNotificationBody(settings: Settings) {
  return {
    title: '💧 Time to Hydrate!',
    body: settings.reminderMessage || 'Stay healthy and drink some water!',
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default', launchActivity: 'default' },
      fullScreenAction: { id: 'default', launchActivity: 'default' },
      showTimestamp: false,
      vibrationPattern: [300, 400, 200, 400, 200, 600],
      actions: [
        { title: '✅ Done', pressAction: { id: 'done' } },
        { title: '⏭️ Pass', pressAction: { id: 'pass' } },
        { title: '💤 Snooze 10m', pressAction: { id: 'snooze' } },
      ],
      color: '#1E88E5',
    },
    data: {
      amount: String(settings.amountPerReminder),
      type: 'reminder',
    },
  };
}

export async function scheduleAllNotifications(settings: Settings): Promise<string[]> {
  await cancelAllReminderNotifications();
  await createNotificationChannel();

  const times = getNotificationTimesForDay(settings);
  const ids: string[] = [];

  for (const time of times) {
    const id = `water_${time.getTime()}`;
    await notifee.createTriggerNotification(
      { ...buildNotificationBody(settings), id },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: time.getTime(),
        alarmManager: { allowWhileIdle: true },
      },
    );
    ids.push(id);
  }

  // Schedule a silent reschedule trigger for tomorrow's window start
  await scheduleDailyReschedule(settings);

  return ids;
}

async function scheduleDailyReschedule(settings: Settings): Promise<void> {
  const [startH, startM] = settings.startTime.split(':').map(Number);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(startH, startM, 0, 0);

  await notifee.createTriggerNotification(
    {
      id: RESCHEDULE_NOTIFICATION_ID,
      title: '💧 Time to Hydrate!',
      body: settings.reminderMessage || 'Stay healthy and drink some water!',
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default', launchActivity: 'default' },
        fullScreenAction: { id: 'default', launchActivity: 'default' },
        vibrationPattern: [300, 400, 200, 400, 200, 600],
        actions: [
          { title: '✅ Done', pressAction: { id: 'done' } },
          { title: '⏭️ Pass', pressAction: { id: 'pass' } },
          { title: '💤 Snooze 10m', pressAction: { id: 'snooze' } },
        ],
        color: '#1E88E5',
      },
      data: {
        amount: String(settings.amountPerReminder),
        type: 'daily_start',
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: tomorrow.getTime(),
      alarmManager: { allowWhileIdle: true },
    },
  );
}

export async function cancelAllReminderNotifications(): Promise<void> {
  const triggers = await notifee.getTriggerNotifications();
  const ids = triggers
    .map(t => t.notification.id!)
    .filter(id => id.startsWith('water_') || id === RESCHEDULE_NOTIFICATION_ID);
  await Promise.all(ids.map(id => notifee.cancelTriggerNotification(id)));
}

export async function cancelAllNotifications(): Promise<void> {
  await notifee.cancelAllNotifications();
}

export async function scheduleSnooze(notificationData: Record<string, string>, minutes: number = 10): Promise<void> {
  const snoozeTime = Date.now() + minutes * 60 * 1000;
  const amount = notificationData?.amount || '250';

  await notifee.createTriggerNotification(
    {
      id: `snooze_${Date.now()}`,
      title: '💧 Snoozed Reminder',
      body: `Time to drink water! (${amount}ml)`,
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default', launchActivity: 'default' },
        fullScreenAction: { id: 'default', launchActivity: 'default' },
        vibrationPattern: [300, 400, 200, 400, 200, 600],
        actions: [
          { title: '✅ Done', pressAction: { id: 'done' } },
          { title: '⏭️ Pass', pressAction: { id: 'pass' } },
        ],
        color: '#1E88E5',
      },
      data: { amount, type: 'snooze' },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: snoozeTime,
      alarmManager: { allowWhileIdle: true },
    },
  );
}

async function loadSettingsFromStorage(): Promise<Settings | null> {
  try {
    const raw = await (await import('@react-native-async-storage/async-storage')).default.getItem('highdrator-store');
    if (!raw) { return null; }
    const parsed = JSON.parse(raw);
    return parsed?.state?.settings ?? null;
  } catch {
    return null;
  }
}

export async function handleNotificationBackground(
  type: EventType,
  detail: EventDetail,
): Promise<void> {
  const { pressAction, notification } = detail;

  if (!notification) { return; }

  const data = notification.data as Record<string, string> | undefined;
  const amount = parseInt(data?.amount || '250', 10);
  const notifType = data?.type;

  // Daily reschedule notification fired — schedule all of today's reminders
  if (notifType === 'daily_start') {
    const settings = await loadSettingsFromStorage();
    if (settings) {
      await scheduleAllNotifications(settings);
    }
    await notifee.cancelNotification(notification.id!);
    return;
  }

  if (type === EventType.ACTION_PRESS && pressAction) {
    switch (pressAction.id) {
      case 'done':
        await appendLogForToday(amount);
        await notifee.cancelNotification(notification.id!);
        break;
      case 'pass':
        await notifee.cancelNotification(notification.id!);
        break;
      case 'snooze':
        await notifee.cancelNotification(notification.id!);
        if (data) { await scheduleSnooze(data); }
        break;
      default:
        break;
    }
  }
}

export async function displayForegroundNotification(settings: Settings): Promise<void> {
  await createNotificationChannel();
  await notifee.displayNotification({
    ...buildNotificationBody(settings),
    id: `foreground_${Date.now()}`,
  });
}
