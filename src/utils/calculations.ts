import { Settings } from '../types';

export function calculateDailyTarget(settings: Pick<Settings, 'startTime' | 'endTime' | 'intervalMinutes' | 'amountPerReminder'>): number {
  const [startH, startM] = settings.startTime.split(':').map(Number);
  const [endH, endM] = settings.endTime.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const windowMinutes = endMinutes - startMinutes;

  if (windowMinutes <= 0) { return 2000; }

  const remindersPerDay = Math.floor(windowMinutes / settings.intervalMinutes);
  return remindersPerDay * settings.amountPerReminder;
}

export function calculateProgress(current: number, target: number): number {
  if (target <= 0) { return 0; }
  return Math.min((current / target) * 100, 100);
}

export function calculateGlasses(totalMl: number, mlPerGlass: number = 250): number {
  return Math.floor(totalMl / mlPerGlass);
}

export function getNextReminderTime(settings: Settings): Date | null {
  const now = new Date();
  const today = new Date(now);

  const [endH, endM] = settings.endTime.split(':').map(Number);
  const endToday = new Date(today);
  endToday.setHours(endH, endM, 0, 0);

  if (now >= endToday) { return null; }

  const [startH, startM] = settings.startTime.split(':').map(Number);
  const startToday = new Date(today);
  startToday.setHours(startH, startM, 0, 0);

  let next = new Date(startToday);
  while (next <= now) {
    next = new Date(next.getTime() + settings.intervalMinutes * 60 * 1000);
  }

  if (next > endToday) { return null; }
  return next;
}

export function getNotificationTimesForDay(settings: Settings, date: Date = new Date()): Date[] {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const [startH, startM] = settings.startTime.split(':').map(Number);
  const [endH, endM] = settings.endTime.split(':').map(Number);

  const windowStart = new Date(dayStart);
  windowStart.setHours(startH, startM, 0, 0);

  const windowEnd = new Date(dayStart);
  windowEnd.setHours(endH, endM, 0, 0);

  const now = new Date();
  const times: Date[] = [];
  let current = new Date(windowStart);

  // Skip past times (plus a 5-second buffer)
  while (current <= now && current < windowEnd) {
    current = new Date(current.getTime() + settings.intervalMinutes * 60 * 1000);
  }

  while (current < windowEnd) {
    times.push(new Date(current));
    current = new Date(current.getTime() + settings.intervalMinutes * 60 * 1000);
  }

  return times;
}

export function getWeeklyAverage(logs: Record<string, { amount: number }[]>): number {
  const today = new Date();
  let totalMl = 0;
  let daysWithData = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLogs = logs[key] || [];
    if (dayLogs.length > 0) {
      totalMl += dayLogs.reduce((s, l) => s + l.amount, 0);
      daysWithData++;
    }
  }

  return daysWithData > 0 ? Math.round(totalMl / daysWithData) : 0;
}
