import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: number; // 0–100
  size: number;
  strokeWidth?: number;
  centerContent?: React.ReactNode;
}

export const CircularProgress: React.FC<Props> = ({
  progress,
  size,
  strokeWidth = 14,
  centerContent,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedOffset = useSharedValue(circumference);

  useEffect(() => {
    const clampedProgress = Math.min(Math.max(progress, 0), 100);
    const targetOffset = circumference - (clampedProgress / 100) * circumference;
    animatedOffset.value = withSpring(targetOffset, {
      damping: 20,
      stiffness: 90,
    });
  }, [progress, circumference]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedOffset.value,
  }));

  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Colors.primaryDark} stopOpacity="1" />
            <Stop offset="1" stopColor={Colors.accent} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={Colors.water10}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress arc */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#progressGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90, ${center}, ${center})`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.centerContent}>{centerContent}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
