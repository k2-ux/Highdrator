import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  shadow?: 'sm' | 'md' | 'lg' | 'none';
}

export const Card: React.FC<Props> = ({
  children,
  style,
  padding = Spacing.md,
  shadow = 'md',
}) => {
  const shadowStyle = shadow === 'none' ? {} : Shadows[shadow];

  return (
    <View
      style={[
        styles.card,
        shadowStyle,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
