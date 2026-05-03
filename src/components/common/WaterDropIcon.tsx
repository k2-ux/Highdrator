import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  gradient?: boolean;
}

export const WaterDropIcon: React.FC<Props> = ({ size = 24, color = '#1E88E5', gradient = false }) => {
  const id = `dropGrad_${size}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {gradient && (
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#00BCD4" />
            <Stop offset="1" stopColor="#1565C0" />
          </LinearGradient>
        </Defs>
      )}
      <Path
        d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0C19 10 12 2 12 2Z"
        fill={gradient ? `url(#${id})` : color}
      />
    </Svg>
  );
};
