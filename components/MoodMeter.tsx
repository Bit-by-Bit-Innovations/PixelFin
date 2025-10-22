import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type MoodMeterPalette = {
  gradient: string[];
  highlight: string;
  muted: string;
  accent: string;
  meterTrack: string;
  meterFill: string;
};

type MoodMeterProps = {
  trend: number;
  savingsRate: number;
  lazyDays: number;
  palette: MoodMeterPalette;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const MoodMeter: React.FC<MoodMeterProps> = ({ trend, savingsRate, lazyDays, palette }) => {
  const trendValue = clamp(trend, -1, 1);
  const moodScore = clamp(0.5 + trendValue * 0.35 + (savingsRate - 0.5) * 0.4, 0, 1);
  const percentageFill = Math.round(moodScore * 100);

  const comment = useMemo(() => {
    if (lazyDays >= 3 || savingsRate < 0.15) {
      return 'Lazy Alert: Your pixel pal is nodding off — stash some coins to wake it up!';
    }

    if (savingsRate < 0.3) {
      return 'Lazy Alert: Combo is slipping. Drop a tiny deposit to keep the streak alive.';
    }

    if (savingsRate > 0.65 && trend >= 0.05) {
      return 'Combo Surging: Savings streak unlocked! Treat yourself to a celebratory pixel smoothie.';
    }

    if (trend < -0.05) {
      return 'Warning: Spending surge detected. Patch the leak to guard your retro riches.';
    }

    return 'Steady signal: Keep coasting with consistent saves to level up the PixelFin mood.';
  }, [lazyDays, savingsRate, trend]);

  const moodLabel = useMemo(() => {
    if (trendValue > 0.2) return 'Pixel mood: Leveling Up';
    if (trendValue < -0.2) return 'Pixel mood: Danger Zone';
    return 'Pixel mood: Balanced Drift';
  }, [trendValue]);

  return (
    <View style={[styles.wrapper, { backgroundColor: 'rgba(15, 23, 42, 0.25)' }]}
      accessibilityRole="summary"
      accessibilityLabel={`Mood meter at ${percentageFill} percent. ${comment}`}>
      <Text style={[styles.title, { color: palette.muted }]}>Mood Meter</Text>
      <Text style={[styles.moodLabel, { color: palette.highlight }]}>{moodLabel}</Text>
      <View style={[styles.meterTrack, { backgroundColor: palette.meterTrack }]}>
        <LinearGradient
          colors={[palette.meterFill, palette.highlight]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.meterFill, { width: `${percentageFill}%` }]}
        />
      </View>
      <Text style={[styles.percentage, { color: palette.highlight }]}>{percentageFill}% vibe</Text>
      <View style={styles.feedbackBlock}>
        <Text style={[styles.feedbackHeading, { color: palette.muted }]}>Lazy Alert</Text>
        <Text style={[styles.feedbackText, { color: palette.accent }]}>{comment}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  moodLabel: {
    fontFamily: 'VT323',
    fontSize: 32,
    letterSpacing: 1,
    marginBottom: 16,
  },
  meterTrack: {
    height: 18,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    marginBottom: 12,
  },
  meterFill: {
    height: '100%',
  },
  percentage: {
    fontFamily: 'VT323',
    fontSize: 26,
    marginBottom: 12,
  },
  feedbackBlock: {
    marginTop: 8,
  },
  feedbackHeading: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 8,
  },
  feedbackText: {
    fontFamily: 'VT323',
    fontSize: 24,
    lineHeight: 28,
  },
});

export default MoodMeter;
