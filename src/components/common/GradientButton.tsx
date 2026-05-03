import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { BorderRadius, Typography } from '../../constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface Props {
  title: string;
  onPress: () => void;
  colors?: string[];
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const GradientButton: React.FC<Props> = ({
  title,
  onPress,
  colors = Colors.gradientAccent,
  style,
  textStyle,
  disabled = false,
  loading = false,
  icon,
  size = 'md',
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const heights = { sm: 40, md: 52, lg: 60 };
  const fontSizes = { sm: 13, md: 16, lg: 18 };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        <LinearGradient
          colors={disabled ? ['#B0BEC5', '#90A4AE'] : colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { height: heights[size], borderRadius: BorderRadius.full }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              {icon}
              <Text
                style={[
                  styles.text,
                  { fontSize: fontSizes[size] },
                  icon ? styles.textWithIcon : undefined,
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  text: {
    ...Typography.bodyMedium,
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
  textWithIcon: {
    marginLeft: 8,
  },
});
