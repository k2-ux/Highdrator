import AsyncStorage from '@react-native-async-storage/async-storage';
import { WaterLog } from '../types';
import { todayKey } from './dateUtils';

const KEYS = {
  waterLogs: (date: string) => `@highdrator:logs_${date}`,
  settings: '@highdrator:settings',
  store: '@highdrator:zustand',
};

export async function readLogsForDate(date: string): Promise<WaterLog[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.waterLogs(date));
    return raw ? (JSON.parse(raw) as WaterLog[]) : [];
  } catch {
    return [];
  }
}

export async function writeLogsForDate(date: string, logs: WaterLog[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.waterLogs(date), JSON.stringify(logs));
  } catch {}
}

export async function appendLogForToday(amount: number): Promise<WaterLog> {
  const date = todayKey();
  const logs = await readLogsForDate(date);
  const newLog: WaterLog = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    amount,
  };
  logs.push(newLog);
  await writeLogsForDate(date, logs);
  return newLog;
}

export async function clearAllData(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const appKeys = allKeys.filter(k => k.startsWith('@highdrator:'));
    await AsyncStorage.multiRemove(appKeys);
  } catch {}
}
