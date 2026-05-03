import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../constants/colors';
import { BorderRadius, Spacing, Typography, Shadows } from '../constants/theme';
import { useStore } from '../store/useStore';
import { INTERVAL_OPTIONS, AMOUNT_PRESETS } from '../types';
import { calculateDailyTarget } from '../utils/calculations';
import {
  formatTimeString,
  dateToTimeString,
  timeStringToDate,
  formatLiters,
} from '../utils/dateUtils';
import notifee, { TriggerType, AndroidImportance } from '@notifee/react-native';
import {
  scheduleAllNotifications,
  cancelAllNotifications,
  checkExactAlarmPermission,
} from '../utils/notifications';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, isScheduleActive, setScheduleActive, resetAllData } = useStore();

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [customTarget, setCustomTarget] = useState(
    settings.isManualTarget ? String(settings.dailyTarget) : '',
  );

  const autoTarget = calculateDailyTarget(settings);

  const handleStartTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (date) {
      updateSettings({ startTime: dateToTimeString(date) });
    }
  };

  const handleEndTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (date) {
      updateSettings({ endTime: dateToTimeString(date) });
    }
  };

  const handleIntervalSelect = (minutes: number) => {
    updateSettings({ intervalMinutes: minutes });
    if (isScheduleActive) {
      scheduleAllNotifications({ ...settings, intervalMinutes: minutes });
    }
  };

  const handleAmountSelect = (amount: number) => {
    updateSettings({ amountPerReminder: amount });
  };

  const handleManualTargetToggle = (value: boolean) => {
    updateSettings({ isManualTarget: value });
    if (!value) {
      updateSettings({ dailyTarget: autoTarget });
    }
  };

  const handleManualTargetSave = () => {
    const parsed = parseInt(customTarget, 10);
    if (!isNaN(parsed) && parsed >= 500 && parsed <= 10000) {
      updateSettings({ dailyTarget: parsed, isManualTarget: true });
    } else {
      Alert.alert('Invalid Target', 'Please enter a value between 500ml and 10,000ml');
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your water logs and reset settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await cancelAllNotifications();
            resetAllData();
          },
        },
      ],
    );
  };

  const applyScheduleChanges = async () => {
    if (isScheduleActive) {
      await scheduleAllNotifications(settings);
      Alert.alert('Schedule Updated', 'Your reminder schedule has been updated.');
    }
  };

  const handleTestNotification = async () => {
    const hasAlarm = await checkExactAlarmPermission();
    if (!hasAlarm) {
      Alert.alert(
        'Alarm Permission Missing',
        'Cannot schedule test — please grant Alarms & Reminders permission first via "Start Reminders" on the Home screen.',
      );
      return;
    }

    const fireAt = Date.now() + 10 * 1000;
    await notifee.createChannel({
      id: 'highdrator_reminders',
      name: 'Hydration Reminders',
      importance: AndroidImportance.HIGH,
    });
    await notifee.createTriggerNotification(
      {
        id: `test_${fireAt}`,
        title: '💧 Test Reminder',
        body: `This is a test — ${settings.amountPerReminder}ml logged when you tap Done!`,
        android: {
          channelId: 'highdrator_reminders',
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default', launchActivity: 'default' },
          actions: [
            { title: '✅ Done', pressAction: { id: 'done' } },
            { title: '⏭️ Pass', pressAction: { id: 'pass' } },
            { title: '💤 Snooze 10m', pressAction: { id: 'snooze' } },
          ],
        },
        data: { amount: String(settings.amountPerReminder), type: 'reminder' },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: fireAt,
        alarmManager: { allowWhileIdle: true },
      },
    );
    Alert.alert('Test scheduled!', 'A notification will fire in 10 seconds.\n\nYou can lock the screen or kill the app to test background handling.');
  };

  const SectionHeader: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={16} color={Colors.primary} />
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const SettingRow: React.FC<{
    label: string;
    description?: string;
    right?: React.ReactNode;
  }> = ({ label, description, right }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description ? <Text style={styles.settingDesc}>{description}</Text> : null}
      </View>
      {right}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Time Window */}
        <View style={styles.section}>
          <SectionHeader title="Active Time Window" icon="clock-outline" />
          <View style={styles.card}>
            <View style={styles.timeRow}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>Start Time</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Icon name="clock-start" size={16} color={Colors.primary} />
                  <Text style={styles.timeValue}>{formatTimeString(settings.startTime)}</Text>
                </TouchableOpacity>
              </View>
              <Icon name="arrow-right" size={20} color={Colors.textTertiary} />
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>End Time</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Icon name="clock-end" size={16} color={Colors.primary} />
                  <Text style={styles.timeValue}>{formatTimeString(settings.endTime)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {showStartPicker && (
              <DateTimePicker
                value={timeStringToDate(settings.startTime)}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleStartTimeChange}
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                value={timeStringToDate(settings.endTime)}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndTimeChange}
              />
            )}
          </View>
        </View>

        {/* Reminder Interval */}
        <View style={styles.section}>
          <SectionHeader title="Reminder Interval" icon="timer-outline" />
          <View style={styles.card}>
            <View style={styles.chipRow}>
              {INTERVAL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.minutes}
                  style={[
                    styles.chip,
                    settings.intervalMinutes === opt.minutes && styles.chipSelected,
                  ]}
                  onPress={() => handleIntervalSelect(opt.minutes)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      settings.intervalMinutes === opt.minutes && styles.chipTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Amount per reminder */}
        <View style={styles.section}>
          <SectionHeader title="Amount per Reminder" icon="cup-water" />
          <View style={styles.card}>
            <View style={styles.chipRow}>
              {AMOUNT_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.chip,
                    settings.amountPerReminder === preset.value && styles.chipSelected,
                  ]}
                  onPress={() => handleAmountSelect(preset.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      settings.amountPerReminder === preset.value && styles.chipTextSelected,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Daily Goal */}
        <View style={styles.section}>
          <SectionHeader title="Daily Goal" icon="target" />
          <View style={styles.card}>
            <SettingRow
              label="Manual Target"
              description={`Auto-calculated: ${formatLiters(autoTarget)}`}
              right={
                <Switch
                  value={settings.isManualTarget}
                  onValueChange={handleManualTargetToggle}
                  trackColor={{ true: Colors.primary }}
                  thumbColor={Colors.surface}
                />
              }
            />
            {settings.isManualTarget && (
              <View style={styles.manualTargetRow}>
                <TextInput
                  style={styles.manualTargetInput}
                  value={customTarget}
                  onChangeText={setCustomTarget}
                  keyboardType="number-pad"
                  placeholder="e.g. 2500"
                  placeholderTextColor={Colors.textTertiary}
                  maxLength={5}
                />
                <Text style={styles.mlText}>ml</Text>
                <TouchableOpacity style={styles.saveBtn} onPress={handleManualTargetSave}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.currentGoalRow}>
              <Icon name="flag-checkered" size={16} color={Colors.success} />
              <Text style={styles.currentGoalText}>
                Current goal: <Text style={{ color: Colors.success, fontWeight: '600' }}>{formatLiters(settings.dailyTarget)}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <SectionHeader title="Notifications" icon="bell-outline" />
          <View style={styles.card}>
            <SettingRow
              label="Sound"
              description="Play notification sound"
              right={
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={(v) => updateSettings({ soundEnabled: v })}
                  trackColor={{ true: Colors.primary }}
                  thumbColor={Colors.surface}
                />
              }
            />
            <View style={styles.separator} />
            <SettingRow
              label="Vibration"
              description="Vibrate on reminder"
              right={
                <Switch
                  value={settings.vibrationEnabled}
                  onValueChange={(v) => updateSettings({ vibrationEnabled: v })}
                  trackColor={{ true: Colors.primary }}
                  thumbColor={Colors.surface}
                />
              }
            />
          </View>
        </View>

        {/* Reminder Message */}
        <View style={styles.section}>
          <SectionHeader title="Reminder Message" icon="message-text-outline" />
          <View style={styles.card}>
            <TextInput
              style={styles.messageInput}
              value={settings.reminderMessage}
              onChangeText={(v) => updateSettings({ reminderMessage: v })}
              placeholder="Enter reminder message..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              maxLength={100}
            />
            <Text style={styles.charCount}>{settings.reminderMessage.length}/100</Text>
          </View>
        </View>

        {/* Apply Changes button (if schedule active) */}
        {isScheduleActive && (
          <TouchableOpacity style={styles.applyBtn} onPress={applyScheduleChanges}>
            <Icon name="refresh" size={18} color={Colors.primary} />
            <Text style={styles.applyBtnText}>Apply Changes to Schedule</Text>
          </TouchableOpacity>
        )}

        {/* Test Notification */}
        <View style={styles.section}>
          <SectionHeader title="Developer" icon="flask-outline" />
          <View style={styles.card}>
            <TouchableOpacity style={styles.testBtn} onPress={handleTestNotification}>
              <Icon name="bell-ring-outline" size={18} color={Colors.primary} />
              <View style={styles.testBtnText}>
                <Text style={styles.testBtnTitle}>Send Test Notification</Text>
                <Text style={styles.testBtnSub}>Fires in 10 seconds — tests Done / Snooze / Pass</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <SectionHeader title="Data" icon="database-outline" />
          <View style={styles.card}>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleResetData}>
              <Icon name="delete-outline" size={18} color={Colors.error} />
              <Text style={styles.dangerBtnText}>Reset All Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionText}>Highdrator v1.0.0 · Made with 💧</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  screenTitle: { ...Typography.h1, color: Colors.text, marginBottom: Spacing.md },

  section: { marginBottom: Spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    paddingLeft: 4,
  },
  sectionHeaderText: {
    ...Typography.label,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeBlock: { flex: 1, alignItems: 'center' },
  timeLabel: { ...Typography.caption, color: Colors.textTertiary, marginBottom: 4 },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.water10,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  timeValue: { ...Typography.bodyMedium, color: Colors.primary, fontWeight: '600' },

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

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  settingInfo: { flex: 1, marginRight: Spacing.md },
  settingLabel: { ...Typography.body, color: Colors.text },
  settingDesc: { ...Typography.caption, color: Colors.textTertiary, marginTop: 1 },

  manualTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  manualTargetInput: {
    flex: 1,
    height: 40,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.water10,
  },
  mlText: { ...Typography.body, color: Colors.textSecondary },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm - 2,
    paddingHorizontal: Spacing.md,
  },
  saveBtnText: { ...Typography.label, color: '#fff', fontWeight: '600' },

  currentGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  currentGoalText: { ...Typography.body, color: Colors.textSecondary },

  separator: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },

  messageInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    ...Typography.body,
    color: Colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCount: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },

  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.md,
    backgroundColor: Colors.water10,
  },
  applyBtnText: { ...Typography.label, color: Colors.primary, fontWeight: '600' },

  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  testBtnText: { flex: 1 },
  testBtnTitle: { ...Typography.bodyMedium, color: Colors.primary },
  testBtnSub: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2 },

  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm + 2,
  },
  dangerBtnText: { ...Typography.body, color: Colors.error },

  versionText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
