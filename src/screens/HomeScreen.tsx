import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../constants/colors';
import { BorderRadius, Spacing, Typography, Shadows } from '../constants/theme';
import { CircularProgress } from '../components/common/CircularProgress';
import { Card } from '../components/common/Card';
import { GradientButton } from '../components/common/GradientButton';
import { QuickLogModal } from '../components/home/QuickLogModal';
import { useStore } from '../store/useStore';
import {
  formatLiters,
  formatTime,
  getGreeting,
  formatDateFull,
  todayKey,
} from '../utils/dateUtils';
import { calculateProgress, getNextReminderTime } from '../utils/calculations';
import { getDailyQuote } from '../constants/quotes';
import {
  scheduleAllNotifications,
  cancelAllNotifications,
  requestNotificationPermission,
  checkExactAlarmPermission,
  openExactAlarmSettings,
  openBatteryOptimizationSettings,
} from '../utils/notifications';

export const HomeScreen: React.FC = () => {
  const {
    settings,
    isScheduleActive,
    setScheduleActive,
    logWater,
    undoLastLog,
    getTodayTotal,
    getTodayLogs,
    getStreak,
    syncLogsFromStorage,
  } = useStore();

  const [showLogModal, setShowLogModal] = useState(false);
  const [nextReminder, setNextReminder] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [quote] = useState(getDailyQuote);

  const todayTotal = getTodayTotal();
  const todayLogs = getTodayLogs();
  const streak = getStreak();
  const progress = calculateProgress(todayTotal, settings.dailyTarget);
  const glassCount = Math.floor(todayTotal / 250);

  useFocusEffect(
    useCallback(() => {
      syncLogsFromStorage();
      const next = getNextReminderTime(settings);
      setNextReminder(next);
    }, [settings, syncLogsFromStorage]),
  );

  // Update next reminder every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNextReminder(getNextReminderTime(settings));
    }, 60000);
    return () => clearInterval(interval);
  }, [settings]);

  const handleToggleSchedule = async () => {
    if (isScheduleActive) {
      await cancelAllNotifications();
      setScheduleActive(false);
    } else {
      // 1. Check POST_NOTIFICATIONS permission
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Notifications Blocked',
          'Enable notifications for Highdrator in your device Settings → Apps → Highdrator → Notifications.',
        );
        return;
      }

      // 2. Check SCHEDULE_EXACT_ALARM permission (Android 12+)
      const hasAlarmPermission = await checkExactAlarmPermission();
      if (!hasAlarmPermission) {
        Alert.alert(
          'Exact Alarm Permission Required',
          'To receive reminders at the exact scheduled time, please allow "Alarms & reminders" for Highdrator.\n\nTap OK to open settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openExactAlarmSettings() },
          ],
        );
        return;
      }

      // 3. Prompt to disable battery optimization (best-effort)
      Alert.alert(
        'Improve Reliability',
        'For reminders to always fire on time, disable battery optimization for Highdrator.\n\nSettings → Battery → Highdrator → Unrestricted.',
        [
          {
            text: 'Open Battery Settings',
            onPress: async () => {
              await openBatteryOptimizationSettings();
            },
          },
          { text: 'Skip', style: 'cancel' },
        ],
      );

      await scheduleAllNotifications(settings);
      setScheduleActive(true);
      Alert.alert(
        'Reminders Active! 💧',
        `You'll get hydration reminders every ${settings.intervalMinutes} min between ${formatTimeDisplayFromStr(settings.startTime)} and ${formatTimeDisplayFromStr(settings.endTime)}.`,
        [{ text: 'Great!' }],
      );
    }
  };

  const handleLog = (amount: number) => {
    logWater(amount);
  };

  const handleUndoLast = () => {
    Alert.alert('Undo Last', 'Remove the last logged entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Undo', style: 'destructive', onPress: undoLastLog },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await syncLogsFromStorage();
    setRefreshing(false);
  };

  const progressColor = progress >= 100 ? Colors.success : progress >= 60 ? Colors.primary : Colors.warning;
  const motivationalText =
    progress >= 100 ? '🎉 Goal achieved!' :
    progress >= 75 ? '🌊 Almost there!' :
    progress >= 50 ? '💪 Halfway done!' :
    progress >= 25 ? '🚀 Good progress!' :
    '💧 Start hydrating!';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={Colors.gradientPrimary} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.headerDate}>{formatDateFull(todayKey())}</Text>
          </View>
          <View style={styles.headerRight}>
            {isScheduleActive && (
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Progress Ring Card */}
        <Card style={styles.progressCard} shadow="lg">
          <Text style={styles.motivationalText}>{motivationalText}</Text>

          <CircularProgress
            progress={progress}
            size={220}
            strokeWidth={16}
            centerContent={
              <View style={styles.progressCenter}>
                <Text style={styles.intakeAmount}>{formatLiters(todayTotal)}</Text>
                <Text style={styles.targetText}>of {formatLiters(settings.dailyTarget)}</Text>
                <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
              </View>
            }
          />

          {/* Mini progress bar */}
          <View style={styles.miniProgressBg}>
            <View style={[styles.miniProgressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: progressColor }]} />
          </View>
        </Card>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="cup-water"
            value={glassCount.toString()}
            label="Glasses"
            color={Colors.primary}
          />
          <StatCard
            icon="fire"
            value={`${streak}d`}
            label="Streak"
            color={Colors.warning}
          />
          <StatCard
            icon="clock-outline"
            value={isScheduleActive && nextReminder ? formatTime(nextReminder) : '--:--'}
            label="Next"
            color={Colors.accent}
          />
        </View>

        {/* I Drank Button */}
        <GradientButton
          title="I Drank Water!"
          onPress={() => setShowLogModal(true)}
          colors={Colors.gradientAccent}
          style={styles.logButton}
          size="lg"
          icon={<Icon name="water-plus" size={24} color="#fff" />}
        />

        {/* Schedule Toggle & Undo row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, isScheduleActive ? styles.actionBtnActive : styles.actionBtnInactive]}
            onPress={handleToggleSchedule}
          >
            <Icon
              name={isScheduleActive ? 'pause-circle-outline' : 'play-circle-outline'}
              size={20}
              color={isScheduleActive ? Colors.error : Colors.success}
            />
            <Text style={[styles.actionBtnText, { color: isScheduleActive ? Colors.error : Colors.success }]}>
              {isScheduleActive ? 'Pause Reminders' : 'Start Reminders'}
            </Text>
          </TouchableOpacity>

          {todayLogs.length > 0 && (
            <TouchableOpacity style={styles.undoBtn} onPress={handleUndoLast}>
              <Icon name="undo" size={18} color={Colors.textSecondary} />
              <Text style={styles.undoBtnText}>Undo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Today's logs */}
        {todayLogs.length > 0 && (
          <Card style={styles.logsCard}>
            <Text style={styles.logsTitle}>Today's Log</Text>
            {[...todayLogs].reverse().slice(0, 5).map((log) => (
              <View key={log.id} style={styles.logEntry}>
                <Icon name="water" size={16} color={Colors.primaryLight} />
                <Text style={styles.logAmount}>{log.amount}ml</Text>
                <Text style={styles.logTime}>{formatTime(new Date(log.timestamp))}</Text>
              </View>
            ))}
            {todayLogs.length > 5 && (
              <Text style={styles.moreLogsText}>+{todayLogs.length - 5} more entries</Text>
            )}
          </Card>
        )}

        {/* Hydration Quote */}
        <Card style={styles.quoteCard} shadow="sm">
          <Icon name="format-quote-open" size={20} color={Colors.primaryLight} />
          <Text style={styles.quoteText}>{quote}</Text>
        </Card>
      </ScrollView>

      <QuickLogModal
        visible={showLogModal}
        defaultAmount={settings.amountPerReminder}
        onLog={handleLog}
        onClose={() => setShowLogModal(false)}
      />
    </SafeAreaView>
  );
};

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color }) => (
  <View style={statStyles.card}>
    <Icon name={icon} size={22} color={color} />
    <Text style={[statStyles.value, { color }]}>{value}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

function formatTimeDisplayFromStr(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return formatTime(d);
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  value: { ...Typography.h3, marginTop: 4, fontWeight: '700' },
  label: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: { ...Typography.h2, color: '#fff', fontWeight: '800' },
  headerDate: { ...Typography.body, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#69F0AE',
    marginRight: 4,
  },
  activeBadgeText: { ...Typography.captionMedium, color: '#fff' },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },

  progressCard: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  motivationalText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  progressCenter: { alignItems: 'center' },
  intakeAmount: { fontSize: 32, fontWeight: '800', color: Colors.text, letterSpacing: -1 },
  targetText: { ...Typography.body, color: Colors.textSecondary },
  progressPercent: { ...Typography.captionMedium, color: Colors.textTertiary, marginTop: 2 },
  miniProgressBg: {
    width: '80%',
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },

  statsRow: { flexDirection: 'row', marginBottom: Spacing.md },

  logButton: { marginBottom: Spacing.md },

  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
    borderWidth: 1.5,
  },
  actionBtnActive: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  actionBtnInactive: {
    borderColor: Colors.success,
    backgroundColor: '#F5FFF7',
  },
  actionBtnText: { ...Typography.label, fontWeight: '600' },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 4,
  },
  undoBtnText: { ...Typography.label, color: Colors.textSecondary },

  logsCard: { marginBottom: Spacing.md },
  logsTitle: { ...Typography.label, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  logEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  logAmount: { ...Typography.bodyMedium, color: Colors.text, flex: 1 },
  logTime: { ...Typography.caption, color: Colors.textTertiary },
  moreLogsText: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.sm },

  quoteCard: { marginBottom: Spacing.md },
  quoteText: { ...Typography.body, color: Colors.textSecondary, fontStyle: 'italic', marginTop: Spacing.xs, lineHeight: 22 },
});
