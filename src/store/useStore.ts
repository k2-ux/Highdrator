import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings, WaterLog, DayRecord, INTERVAL_OPTIONS } from '../types';
import { todayKey, getDateKey, getLast30DayKeys } from '../utils/dateUtils';
import { readLogsForDate } from '../utils/storage';
import { calculateDailyTarget } from '../utils/calculations';

const DEFAULT_SETTINGS: Settings = {
  startTime: '08:00',
  endTime: '22:00',
  amountPerReminder: 250,
  intervalMinutes: 60,
  dailyTarget: 2000,
  isManualTarget: false,
  soundEnabled: true,
  vibrationEnabled: true,
  reminderMessage: 'Stay healthy and drink some water! 💧',
  darkMode: false,
};

interface StoreState {
  settings: Settings;
  hasCompletedOnboarding: boolean;
  isScheduleActive: boolean;
  waterLogs: Record<string, WaterLog[]>; // date key -> logs

  // Actions
  updateSettings: (partial: Partial<Settings>) => void;
  completeOnboarding: (partial: Partial<Settings>) => void;
  logWater: (amount: number, date?: string) => void;
  undoLastLog: () => void;
  setScheduleActive: (active: boolean) => void;
  resetAllData: () => void;
  syncLogsFromStorage: () => Promise<void>;

  // Selectors
  getTodayLogs: () => WaterLog[];
  getTodayTotal: () => number;
  getLogsForDate: (date: string) => WaterLog[];
  getTotalForDate: (date: string) => number;
  getStreak: () => number;
  getBestStreak: () => number;
  getLast30Days: () => DayRecord[];
  getWeeklyAverage: () => number;
  getTotalGlassesAllTime: () => number;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      hasCompletedOnboarding: false,
      isScheduleActive: false,
      waterLogs: {},

      updateSettings: (partial) => {
        set((state) => {
          const newSettings = { ...state.settings, ...partial };
          if (!newSettings.isManualTarget) {
            newSettings.dailyTarget = calculateDailyTarget(newSettings);
          }
          return { settings: newSettings };
        });
      },

      completeOnboarding: (partial) => {
        set((state) => {
          const newSettings = { ...state.settings, ...partial };
          if (!newSettings.isManualTarget) {
            newSettings.dailyTarget = calculateDailyTarget(newSettings);
          }
          return { settings: newSettings, hasCompletedOnboarding: true };
        });
      },

      logWater: (amount, date) => {
        const key = date || todayKey();
        const newLog: WaterLog = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          amount,
        };
        set((state) => ({
          waterLogs: {
            ...state.waterLogs,
            [key]: [...(state.waterLogs[key] || []), newLog],
          },
        }));
      },

      undoLastLog: () => {
        const key = todayKey();
        set((state) => {
          const logs = [...(state.waterLogs[key] || [])];
          if (logs.length === 0) { return state; }
          logs.pop();
          return {
            waterLogs: { ...state.waterLogs, [key]: logs },
          };
        });
      },

      setScheduleActive: (active) => set({ isScheduleActive: active }),

      resetAllData: () =>
        set({
          waterLogs: {},
          isScheduleActive: false,
          hasCompletedOnboarding: false,
          settings: DEFAULT_SETTINGS,
        }),

      syncLogsFromStorage: async () => {
        const today = todayKey();
        const storageLogs = await readLogsForDate(today);
        const storeLogs = get().waterLogs[today] || [];

        // Merge: add logs from storage that aren't in the store
        const storeIds = new Set(storeLogs.map(l => l.id));
        const newLogs = storageLogs.filter(l => !storeIds.has(l.id));
        if (newLogs.length > 0) {
          set((state) => ({
            waterLogs: {
              ...state.waterLogs,
              [today]: [...(state.waterLogs[today] || []), ...newLogs],
            },
          }));
        }
      },

      getTodayLogs: () => {
        return get().waterLogs[todayKey()] || [];
      },

      getTodayTotal: () => {
        const logs = get().waterLogs[todayKey()] || [];
        return logs.reduce((s, l) => s + l.amount, 0);
      },

      getLogsForDate: (date) => {
        return get().waterLogs[date] || [];
      },

      getTotalForDate: (date) => {
        const logs = get().waterLogs[date] || [];
        return logs.reduce((s, l) => s + l.amount, 0);
      },

      getStreak: () => {
        const { waterLogs } = get();
        let streak = 0;
        const today = new Date();

        // Check if today has any logs
        const todayTotal = (waterLogs[todayKey()] || []).reduce((s, l) => s + l.amount, 0);
        const startDay = todayTotal > 0 ? 0 : 1;

        for (let i = startDay; i < 365; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const key = getDateKey(d);
          const dayTotal = (waterLogs[key] || []).reduce((s, l) => s + l.amount, 0);
          if (dayTotal > 0) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
        return streak;
      },

      getBestStreak: () => {
        const { waterLogs } = get();
        let best = 0;
        let current = 0;
        const today = new Date();

        for (let i = 0; i < 90; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const key = getDateKey(d);
          const dayTotal = (waterLogs[key] || []).reduce((s, l) => s + l.amount, 0);
          if (dayTotal > 0) {
            current++;
            if (current > best) { best = current; }
          } else {
            current = 0;
          }
        }
        return best;
      },

      getLast30Days: () => {
        const { waterLogs, settings } = get();
        return getLast30DayKeys().map((date) => ({
          date,
          logs: waterLogs[date] || [],
          target: settings.dailyTarget,
        }));
      },

      getWeeklyAverage: () => {
        const { waterLogs } = get();
        const today = new Date();
        let total = 0;
        let days = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const key = getDateKey(d);
          const dayTotal = (waterLogs[key] || []).reduce((s, l) => s + l.amount, 0);
          if (dayTotal > 0) {
            total += dayTotal;
            days++;
          }
        }
        return days > 0 ? Math.round(total / 7) : 0;
      },

      getTotalGlassesAllTime: () => {
        const { waterLogs } = get();
        return Object.values(waterLogs)
          .flat()
          .reduce((s, l) => s + Math.floor(l.amount / 250), 0);
      },
    }),
    {
      name: 'highdrator-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const INTERVAL_LABELS = INTERVAL_OPTIONS.map(o => o.label);
