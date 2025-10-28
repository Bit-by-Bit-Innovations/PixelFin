import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TailwindProvider, useTailwind } from 'tailwind-rn';
import utilities from './styles.json';
import { useFonts, VT323_400Regular } from '@expo-google-fonts/vt323';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';

import PixelPet, { PixelPetMood } from './components/PixelPet';
import { DEFAULT_CURRENCY } from './src/constants';
import { useStorage } from './src/hooks/useStorage';
import type { TrendDirection } from './src/types';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: DEFAULT_CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

const moodLabels = {
  happy: 'Cheerful',
  neutral: 'Steady',
  sad: 'Concerned',
} as const;

const directionLabels = {
  up: 'rising',
  flat: 'steady',
  down: 'falling',
} as const;

const resolvePixelPetMood = (isLoading: boolean, direction: TrendDirection): PixelPetMood => {
  if (isLoading) {
    return 'idle';
  }

  if (direction === 'up') {
    return 'happy';
  }

  if (direction === 'down') {
    return 'sad';
  }

  return 'idle';
};

function HomeScreen() {
  const tw = useTailwind();
  const { loading, error, balance, trend, transactions } = useStorage();

  const changeLabel = trend.changeFromPreviousWindow;
  const signedChangeLabel = changeLabel > 0 ? `+${formatCurrency(changeLabel)}` : formatCurrency(changeLabel);
  const petMood = resolvePixelPetMood(loading, trend.direction);

  return (
    <View style={[tw('flex-1 justify-center p-4'), { backgroundColor: trend.backgroundTint }]}
      accessibilityLabel="PixelFin dashboard"
      accessibilityRole="summary">
      <View
        style={[
          tw('items-center'),
          {
            padding: 24,
            borderRadius: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.12)',
          },
        ]}
      >
        <Text
          style={[tw('text-white text-center'), { fontFamily: 'PressStart2P_400Regular', fontSize: 12 }]}
        >
          PixelFin Vault
        </Text>

        <View style={{ marginTop: 24 }}>
          <PixelPet mood={petMood} />
        </View>

        {loading ? (
          <>
            <ActivityIndicator color="white" style={{ marginTop: 24 }} />
            <Text
              style={[tw('text-white text-center mt-2'), { fontFamily: 'VT323_400Regular', fontSize: 24 }]}
            >
              Loading vault...
            </Text>
          </>
        ) : (
          <>
            <Text
              style={[tw('text-white text-center mt-4'), { fontFamily: 'VT323_400Regular', fontSize: 48 }]}
            >
              {formatCurrency(balance)}
            </Text>
            <Text
              style={[tw('text-white text-center mt-2'), { fontFamily: 'PressStart2P_400Regular', fontSize: 10 }]}
            >
              Current balance
            </Text>

            <Text
              style={[tw('text-white text-center mt-4'), { fontFamily: 'PressStart2P_400Regular', fontSize: 10 }]}
            >
              Mood: {moodLabels[trend.mood]} • Trend: {directionLabels[trend.direction]}
            </Text>

            <Text
              style={[tw('text-white text-center mt-2'), { fontFamily: 'PressStart2P_400Regular', fontSize: 10 }]}
            >
              7-day net: {formatCurrency(trend.net)} ({signedChangeLabel} vs prior)
            </Text>

            <Text
              style={[tw('text-white text-center mt-2'), { fontFamily: 'PressStart2P_400Regular', fontSize: 10 }]}
            >
              Saved: {formatCurrency(trend.totalSavings)} • Spent: {formatCurrency(trend.totalExpenses)}
            </Text>

            <Text
              style={[tw('text-white text-center mt-2'), { fontFamily: 'PressStart2P_400Regular', fontSize: 10 }]}
            >
              Entries tracked: {transactions.length}
            </Text>
          </>
        )}

        {error ? (
          <Text
            style={[tw('text-white text-center mt-4'), { fontFamily: 'PressStart2P_400Regular', fontSize: 10 }]}
          >
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    VT323_400Regular,
    PressStart2P_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <TailwindProvider utilities={utilities}>
      <HomeScreen />
      <StatusBar style="light" />
    </TailwindProvider>
  );
}
