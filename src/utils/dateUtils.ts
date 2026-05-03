const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function getDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return getDateKey(new Date());
}

export function formatDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function formatDateFull(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${DAYS_FULL[date.getDay()]}, ${MONTHS_FULL[date.getMonth()]} ${date.getDate()}`;
}

export function formatDateShort(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function getDayLabel(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = Math.round((todayDate.getTime() - date.getTime()) / 86400000);
  if (diff === 0) { return 'Today'; }
  if (diff === 1) { return 'Yesterday'; }
  return DAYS[date.getDay()];
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function formatTimeString(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return formatTime(date);
}

export function timeStringToDate(timeStr: string, baseDate: Date = new Date()): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(h, m, 0, 0);
  return date;
}

export function dateToTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatMilliliters(ml: number): string {
  if (ml >= 1000) {
    return `${(ml / 1000).toFixed(1)}L`;
  }
  return `${ml}ml`;
}

export function formatLiters(ml: number): string {
  return `${(ml / 1000).toFixed(1)}L`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) { return 'Good Morning'; }
  if (hour < 17) { return 'Good Afternoon'; }
  return 'Good Evening';
}

export function getLast7DayKeys(): string[] {
  const keys: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keys.push(getDateKey(d));
  }
  return keys;
}

export function getLast30DayKeys(): string[] {
  const keys: string[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keys.push(getDateKey(d));
  }
  return keys;
}

export function isToday(dateKey: string): boolean {
  return dateKey === todayKey();
}
