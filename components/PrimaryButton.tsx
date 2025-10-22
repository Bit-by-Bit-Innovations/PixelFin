import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

type PrimaryButtonIntent = 'expense' | 'savings';

type PrimaryButtonProps = {
  label: string;
  intent: PrimaryButtonIntent;
  onPress?: () => void;
};

const tailwind = (classNames: string): ViewStyle => {
  const tokens = classNames.trim().split(/\s+/);
  return tokens.reduce<ViewStyle>((style, token) => {
    switch (token) {
      case 'rounded-full':
        style.borderRadius = 9999;
        break;
      case 'px-6':
        style.paddingHorizontal = 24;
        break;
      case 'py-4':
        style.paddingVertical = 16;
        break;
      case 'flex-row':
        style.flexDirection = 'row';
        break;
      case 'items-center':
        style.alignItems = 'center';
        break;
      case 'justify-center':
        style.justifyContent = 'center';
        break;
      default:
        break;
    }
    return style;
  }, {});
};

const baseButtonStyle = tailwind('rounded-full px-6 py-4 flex-row items-center justify-center');

const INTENT_THEMES: Record<PrimaryButtonIntent, { backgroundColor: string; borderColor: string; textColor: string; shadowColor: string; tailwindClass: string }> = {
  expense: {
    backgroundColor: '#fb7185',
    borderColor: '#fecdd3',
    textColor: '#1e293b',
    shadowColor: '#f43f5e',
    tailwindClass: 'bg-rose-500 shadow-lg border border-rose-200',
  },
  savings: {
    backgroundColor: '#34d399',
    borderColor: '#bbf7d0',
    textColor: '#022c22',
    shadowColor: '#10b981',
    tailwindClass: 'bg-emerald-400 shadow-lg border border-emerald-200',
  },
};

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ label, intent, onPress }) => {
  const theme = INTENT_THEMES[intent];

  const handlePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  }, [onPress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.shadow,
        baseButtonStyle,
        {
          backgroundColor: theme.backgroundColor,
          borderColor: theme.borderColor,
          shadowColor: theme.shadowColor,
          transform: [{ translateY: pressed ? 2 : 0 }],
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text style={[styles.label, { color: theme.textColor }]}>{label}</Text>
      <Text style={styles.tailwindHint} accessible={false}>
        {theme.tailwindClass}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  shadow: {
    borderWidth: 2,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  label: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tailwindHint: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
});

export default PrimaryButton;
