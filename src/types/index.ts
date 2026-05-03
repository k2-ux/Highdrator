export interface Settings {
  startTime: string; // "HH:MM"
  endTime: string;
  amountPerReminder: number; // ml
  intervalMinutes: number;
  dailyTarget: number; // ml
  isManualTarget: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  reminderMessage: string;
  darkMode: boolean;
}

export interface WaterLog {
  id: string;
  timestamp: number;
  amount: number; // ml
}

export interface DayRecord {
  date: string; // "YYYY-MM-DD"
  logs: WaterLog[];
  target: number;
}

export type AmountPreset = {
  label: string;
  value: number;
};

export type IntervalOption = {
  label: string;
  minutes: number;
};

export const AMOUNT_PRESETS: AmountPreset[] = [
  { label: '1 Glass (250ml)', value: 250 },
  { label: '1.5 Glasses (375ml)', value: 375 },
  { label: '2 Glasses (500ml)', value: 500 },
  { label: 'Small Bottle (330ml)', value: 330 },
  { label: 'Large Bottle (750ml)', value: 750 },
];

export const INTERVAL_OPTIONS: IntervalOption[] = [
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: '1.5 hours', minutes: 90 },
  { label: '2 hours', minutes: 120 },
];

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Settings: undefined;
};
