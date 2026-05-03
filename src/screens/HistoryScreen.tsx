import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import Svg, { Rect, Text as SvgText, G, Line } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../constants/colors';
import { BorderRadius, Spacing, Typography, Shadows } from '../constants/theme';
import { Card } from '../components/common/Card';
import { useStore } from '../store/useStore';
import {
  formatLiters,
  getDayLabel,
  formatDateShort,
  todayKey,
} from '../utils/dateUtils';
import { calculateProgress } from '../utils/calculations';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING = Spacing.md * 2;
const CHART_WIDTH = SCREEN_WIDTH - CHART_PADDING * 2 - 8;

export const HistoryScreen: React.FC = () => {
  const { settings, getLast30Days, getStreak, getBestStreak, getTotalGlassesAllTime, getWeeklyAverage } = useStore();

  const last30Days = getLast30Days();
  const last7Days = last30Days.slice(-7);
  const streak = getStreak();
  const bestStreak = getBestStreak();
  const totalGlasses = getTotalGlassesAllTime();
  const weeklyAvg = getWeeklyAverage();

  const barData = useMemo(() =>
    last7Days.map((day) => ({
      date: day.date,
      total: day.logs.reduce((s, l) => s + l.amount, 0),
      target: settings.dailyTarget,
    })), [last7Days, settings.dailyTarget]);

  const maxBarValue = Math.max(...barData.map(d => d.total), settings.dailyTarget);

  const CHART_HEIGHT = 140;
  const BAR_GAP = 6;
  const BAR_WIDTH = (CHART_WIDTH - BAR_GAP * 6) / 7;

  const daysWithData = last30Days.filter(d => d.logs.length > 0).length;
  const achievedDays = last30Days.filter(d => {
    const total = d.logs.reduce((s, l) => s + l.amount, 0);
    return total >= settings.dailyTarget;
  }).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>History & Stats</Text>

        {/* Summary Stats */}
        <View style={styles.statsGrid}>
          <SummaryCard icon="fire" value={`${streak}d`} label="Current Streak" color={Colors.warning} />
          <SummaryCard icon="trophy" value={`${bestStreak}d`} label="Best Streak" color={Colors.accent} />
          <SummaryCard icon="cup-water" value={totalGlasses.toString()} label="Total Glasses" color={Colors.primary} />
          <SummaryCard
            icon="trending-up"
            value={formatLiters(weeklyAvg)}
            label="Weekly Avg"
            color={Colors.success}
          />
        </View>

        {/* 7-Day Bar Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Last 7 Days</Text>

          {barData.every(d => d.total === 0) ? (
            <View style={styles.emptyChart}>
              <Icon name="water-off" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>No data yet — start logging!</Text>
            </View>
          ) : (
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 32}>
              {/* Target line */}
              {maxBarValue > 0 && (
                <Line
                  x1={0}
                  y1={(1 - settings.dailyTarget / maxBarValue) * CHART_HEIGHT}
                  x2={CHART_WIDTH}
                  y2={(1 - settings.dailyTarget / maxBarValue) * CHART_HEIGHT}
                  stroke={Colors.primaryLight}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
              )}

              {barData.map((item, index) => {
                const barHeight = maxBarValue > 0 ? (item.total / maxBarValue) * CHART_HEIGHT : 0;
                const x = index * (BAR_WIDTH + BAR_GAP);
                const y = CHART_HEIGHT - barHeight;
                const isToday = item.date === todayKey();
                const achieved = item.total >= item.target;
                const barColor = achieved ? Colors.success : isToday ? Colors.primary : Colors.primaryLight;

                return (
                  <G key={item.date}>
                    {/* Background bar */}
                    <Rect
                      x={x}
                      y={0}
                      width={BAR_WIDTH}
                      height={CHART_HEIGHT}
                      rx={4}
                      fill={Colors.water10}
                    />
                    {/* Data bar */}
                    {barHeight > 0 && (
                      <Rect
                        x={x}
                        y={y}
                        width={BAR_WIDTH}
                        height={barHeight}
                        rx={4}
                        fill={barColor}
                        opacity={0.9}
                      />
                    )}
                    {/* Day label */}
                    <SvgText
                      x={x + BAR_WIDTH / 2}
                      y={CHART_HEIGHT + 16}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={isToday ? '700' : '400'}
                      fill={isToday ? Colors.primary : Colors.textTertiary}
                    >
                      {getDayLabel(item.date)}
                    </SvgText>
                    {/* Amount label on bar */}
                    {barHeight > 20 && (
                      <SvgText
                        x={x + BAR_WIDTH / 2}
                        y={y - 4}
                        textAnchor="middle"
                        fontSize={8}
                        fill={Colors.textSecondary}
                      >
                        {(item.total / 1000).toFixed(1)}L
                      </SvgText>
                    )}
                  </G>
                );
              })}
            </Svg>
          )}

          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.legendText}>Goal reached</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Today</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primaryLight }]} />
              <Text style={styles.legendText}>Partial</Text>
            </View>
          </View>
        </Card>

        {/* Monthly insights */}
        <Card style={styles.insightCard}>
          <Text style={styles.sectionTitle}>30-Day Insights</Text>
          <View style={styles.insightRow}>
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>{daysWithData}</Text>
              <Text style={styles.insightLabel}>Days active</Text>
            </View>
            <View style={styles.insightDivider} />
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>{achievedDays}</Text>
              <Text style={styles.insightLabel}>Goals hit</Text>
            </View>
            <View style={styles.insightDivider} />
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>
                {daysWithData > 0 ? `${Math.round((achievedDays / daysWithData) * 100)}%` : '–'}
              </Text>
              <Text style={styles.insightLabel}>Success rate</Text>
            </View>
          </View>
        </Card>

        {/* Daily history list */}
        <Text style={styles.listSectionTitle}>Daily History</Text>
        {last30Days
          .slice()
          .reverse()
          .filter((d) => d.logs.length > 0 || d.date === todayKey())
          .slice(0, 20)
          .map((day) => {
            const total = day.logs.reduce((s, l) => s + l.amount, 0);
            const prog = calculateProgress(total, settings.dailyTarget);
            const isToday = day.date === todayKey();

            return (
              <Card key={day.date} style={styles.dayCard} shadow="sm" padding={Spacing.md}>
                <View style={styles.dayRow}>
                  <View style={styles.dayInfo}>
                    <Text style={[styles.dayName, isToday && { color: Colors.primary }]}>
                      {getDayLabel(day.date)}
                    </Text>
                    <Text style={styles.dayDate}>{formatDateShort(day.date)}</Text>
                  </View>

                  <View style={styles.dayStats}>
                    <Text style={[styles.dayTotal, { color: prog >= 100 ? Colors.success : Colors.text }]}>
                      {formatLiters(total)}
                    </Text>
                    <Text style={styles.dayTarget}>/ {formatLiters(settings.dailyTarget)}</Text>
                  </View>

                  <View style={styles.dayBadge}>
                    {prog >= 100 ? (
                      <Icon name="check-circle" size={20} color={Colors.success} />
                    ) : (
                      <Text style={styles.dayPercent}>{Math.round(prog)}%</Text>
                    )}
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.dayProgressBg}>
                  <View
                    style={[
                      styles.dayProgressFill,
                      {
                        width: `${Math.min(prog, 100)}%`,
                        backgroundColor: prog >= 100 ? Colors.success : prog >= 50 ? Colors.primary : Colors.warning,
                      },
                    ]}
                  />
                </View>

                {/* Log count */}
                <Text style={styles.logCount}>
                  {day.logs.length} {day.logs.length === 1 ? 'entry' : 'entries'} ·{' '}
                  {day.logs.length > 0 ? `${Math.floor(total / 250)} glasses` : 'no data'}
                </Text>
              </Card>
            );
          })}

        {last30Days.filter(d => d.logs.length > 0).length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="water-off" size={64} color={Colors.border} />
            <Text style={styles.emptyStateTitle}>No history yet</Text>
            <Text style={styles.emptyStateText}>Start logging water on the Home screen!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

interface SummaryCardProps {
  icon: string;
  value: string;
  label: string;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, value, label, color }) => (
  <View style={summaryStyles.card}>
    <Icon name={icon} size={24} color={color} />
    <Text style={[summaryStyles.value, { color }]}>{value}</Text>
    <Text style={summaryStyles.label}>{label}</Text>
  </View>
);

const summaryStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  value: { ...Typography.h3, fontWeight: '700', marginTop: 4 },
  label: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2, textAlign: 'center' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },

  screenTitle: { ...Typography.h1, color: Colors.text, marginBottom: Spacing.md },

  statsGrid: { flexDirection: 'row', marginBottom: Spacing.md },

  chartCard: { marginBottom: Spacing.md },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  emptyChart: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyText: { ...Typography.body, color: Colors.textTertiary, marginTop: Spacing.sm },

  chartLegend: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...Typography.caption, color: Colors.textTertiary },

  insightCard: { marginBottom: Spacing.md },
  insightRow: { flexDirection: 'row', alignItems: 'center' },
  insightItem: { flex: 1, alignItems: 'center' },
  insightValue: { ...Typography.h2, color: Colors.text, fontWeight: '700' },
  insightLabel: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2 },
  insightDivider: { width: 1, height: 40, backgroundColor: Colors.border },

  listSectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },

  dayCard: { marginBottom: Spacing.sm },
  dayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  dayInfo: { flex: 1 },
  dayName: { ...Typography.bodyMedium, color: Colors.text },
  dayDate: { ...Typography.caption, color: Colors.textTertiary },
  dayStats: { flexDirection: 'row', alignItems: 'baseline', marginRight: Spacing.sm },
  dayTotal: { ...Typography.bodyMedium, fontWeight: '600' },
  dayTarget: { ...Typography.caption, color: Colors.textTertiary, marginLeft: 2 },
  dayBadge: { width: 40, alignItems: 'center' },
  dayPercent: { ...Typography.captionMedium, color: Colors.textSecondary },
  dayProgressBg: {
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: 6,
  },
  dayProgressFill: { height: '100%', borderRadius: BorderRadius.full },
  logCount: { ...Typography.caption, color: Colors.textTertiary },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyStateTitle: { ...Typography.h2, color: Colors.textSecondary, marginTop: Spacing.md },
  emptyStateText: { ...Typography.body, color: Colors.textTertiary, marginTop: Spacing.xs },
});
