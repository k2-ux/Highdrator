import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, Typography, Shadows } from '../../constants/theme';
import { AMOUNT_PRESETS } from '../../types';
import { GradientButton } from '../common/GradientButton';

interface Props {
  visible: boolean;
  defaultAmount: number;
  onLog: (amount: number) => void;
  onClose: () => void;
}

export const QuickLogModal: React.FC<Props> = ({
  visible,
  defaultAmount,
  onLog,
  onClose,
}) => {
  const [selectedAmount, setSelectedAmount] = useState(defaultAmount);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const translateY = useSharedValue(400);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(400, { damping: 22, stiffness: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleLog = () => {
    const amount = isCustom ? parseInt(customAmount, 10) || defaultAmount : selectedAmount;
    if (amount > 0 && amount <= 5000) {
      onLog(amount);
      onClose();
    }
  };

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount('');
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View style={[styles.backdrop, backdropStyle]} />
        </Pressable>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={styles.title}>Log Water Intake</Text>
          <Text style={styles.subtitle}>How much did you drink?</Text>

          {/* Preset amounts */}
          <View style={styles.presetsGrid}>
            {AMOUNT_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.value}
                style={[
                  styles.presetChip,
                  !isCustom && selectedAmount === preset.value && styles.presetChipSelected,
                ]}
                onPress={() => handleSelectPreset(preset.value)}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    !isCustom && selectedAmount === preset.value && styles.presetChipTextSelected,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Custom */}
            <TouchableOpacity
              style={[styles.presetChip, isCustom && styles.presetChipSelected]}
              onPress={() => setIsCustom(true)}
            >
              <Text style={[styles.presetChipText, isCustom && styles.presetChipTextSelected]}>
                Custom ml
              </Text>
            </TouchableOpacity>
          </View>

          {/* Custom input */}
          {isCustom && (
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customInput}
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="number-pad"
                placeholder="Enter ml (e.g. 400)"
                placeholderTextColor={Colors.textTertiary}
                autoFocus
                maxLength={4}
              />
              <Text style={styles.mlLabel}>ml</Text>
            </View>
          )}

          {/* Log button */}
          <GradientButton
            title={`Log ${isCustom ? (customAmount || '?') : selectedAmount}ml`}
            onPress={handleLog}
            colors={Colors.gradientAccent}
            style={styles.logButton}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    ...Shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  presetChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  presetChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.water10,
  },
  presetChipText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  presetChipTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.water10,
  },
  customInput: {
    flex: 1,
    height: 48,
    ...Typography.h3,
    color: Colors.text,
  },
  mlLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  logButton: {
    marginTop: Spacing.sm,
  },
});
