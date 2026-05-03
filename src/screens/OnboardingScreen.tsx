import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { BorderRadius, Spacing, Typography, Shadows } from '../constants/theme';
import { GradientButton } from '../components/common/GradientButton';
import { WaterDropIcon } from '../components/common/WaterDropIcon';
import { useStore } from '../store/useStore';
import { INTERVAL_OPTIONS, AMOUNT_PRESETS } from '../types';
import { calculateDailyTarget } from '../utils/calculations';
import { formatTimeString, dateToTimeString, timeStringToDate } from '../utils/dateUtils';
import { createNotificationChannel, requestNotificationPermission } from '../utils/notifications';

export const OnboardingScreen: React.FC = () => {
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');
  const [intervalIdx, setIntervalIdx] = useState(2); // 1 hour default
  const [amountIdx, setAmountIdx] = useState(0); // 250ml default
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const selectedInterval = INTERVAL_OPTIONS[intervalIdx];
  const selectedAmount = AMOUNT_PRESETS[amountIdx];
  const estimatedTarget = calculateDailyTarget({
    startTime,
    endTime,
    intervalMinutes: selectedInterval.minutes,
    amountPerReminder: selectedAmount.value,
  });

  const handleStartTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (date) { setStartTime(dateToTimeString(date)); }
  };

  const handleEndTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (date) { setEndTime(dateToTimeString(date)); }
  };

  const handleGetStarted = async () => {
    await createNotificationChannel();
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Notifications Required',
        'Please enable notifications in settings to receive hydration reminders.',
        [{ text: 'Continue Anyway', onPress: finish }],
      );
      return;
    }
    finish();
  };

  const finish = () => {
    completeOnboarding({
      startTime,
      endTime,
      intervalMinutes: selectedInterval.minutes,
      amountPerReminder: selectedAmount.value,
      soundEnabled,
      vibrationEnabled,
      dailyTarget: estimatedTarget,
      isManualTarget: false,
    });
    // AppNavigator automatically transitions to MainTabs when hasCompletedOnboarding becomes true
  };

  const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <LinearGradient colors={['#1565C0', '#1E88E5', '#00BCD4']} style={styles.header}>
        <WaterDropIcon size={56} gradient />
        <Text style={styles.heroTitle}>Highdrator</Text>
        <Text style={styles.heroSubtitle}>Your daily hydration companion</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.setupTitle}>Let's set up your schedule</Text>

        {/* Time Window */}
        <SectionCard title="Active Time Window">
          <View style={styles.timeRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>Start</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.timeValue}>{formatTimeString(startTime)}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.timeSeparator}>→</Text>

            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>End</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.timeValue}>{formatTimeString(endTime)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={timeStringToDate(startTime)}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartTimeChange}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={timeStringToDate(endTime)}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndTimeChange}
            />
          )}
        </SectionCard>

        {/* Reminder Interval */}
        <SectionCard title="Reminder Interval">
          <View style={styles.chipRow}>
            {INTERVAL_OPTIONS.map((opt, idx) => (
              <TouchableOpacity
                key={opt.minutes}
                style={[styles.chip, intervalIdx === idx && styles.chipSelected]}
                onPress={() => setIntervalIdx(idx)}
              >
                <Text style={[styles.chipText, intervalIdx === idx && styles.chipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* Amount per reminder */}
        <SectionCard title="Amount per Reminder">
          <View style={styles.chipRow}>
            {AMOUNT_PRESETS.map((preset, idx) => (
              <TouchableOpacity
                key={preset.value}
                style={[styles.chip, amountIdx === idx && styles.chipSelected]}
                onPress={() => setAmountIdx(idx)}
              >
                <Text style={[styles.chipText, amountIdx === idx && styles.chipTextSelected]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* Daily Goal Preview */}
        <View style={styles.goalPreview}>
          <Text style={styles.goalLabel}>Estimated Daily Goal</Text>
          <Text style={styles.goalValue}>
            {(estimatedTarget / 1000).toFixed(1)}L
          </Text>
          <Text style={styles.goalNote}>
            Based on your time window and interval
          </Text>
        </View>

        {/* Notifications */}
        <SectionCard title="Notifications">
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Sound</Text>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>
          <View style={[styles.toggleRow, { marginBottom: 0 }]}>
            <Text style={styles.toggleLabel}>Vibration</Text>
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              trackColor={{ true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>
        </SectionCard>

        <GradientButton
          title="Get Started 💧"
          onPress={handleGetStarted}
          colors={Colors.gradientAccent}
          style={styles.ctaButton}
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginTop: Spacing.sm,
    letterSpacing: -1,
  },
  heroSubtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing.xs,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  setupTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginVertical: Spacing.md,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeBlock: { flex: 1, alignItems: 'center' },
  timeLabel: { ...Typography.caption, color: Colors.textTertiary, marginBottom: 4 },
  timeButton: {
    backgroundColor: Colors.water10,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  timeValue: { ...Typography.h3, color: Colors.primary },
  timeSeparator: {
    ...Typography.h3,
    color: Colors.textTertiary,
    marginHorizontal: Spacing.md,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  chipSelected: { borderColor: Colors.primary, backgroundColor: Colors.water10 },
  chipText: { ...Typography.label, color: Colors.textSecondary },
  chipTextSelected: { color: Colors.primary, fontWeight: '600' },
  goalPreview: {
    alignItems: 'center',
    backgroundColor: Colors.water10,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  goalLabel: { ...Typography.label, color: Colors.textSecondary },
  goalValue: { fontSize: 48, fontWeight: '800', color: Colors.primary, marginVertical: 4 },
  goalNote: { ...Typography.caption, color: Colors.textTertiary },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  toggleLabel: { ...Typography.body, color: Colors.text },
  ctaButton: { marginTop: Spacing.md },
});
