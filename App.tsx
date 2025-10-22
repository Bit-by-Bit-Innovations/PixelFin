import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { VT323_400Regular } from '@expo-google-fonts/vt323';

import PrimaryButton from './components/PrimaryButton';
import MoodMeter, { MoodMeterPalette } from './components/MoodMeter';

const FINANCE_SNAPSHOT = {
  balance: 1285.42,
  trend: 0.18,
  savingsRate: 0.62,
  lazyDays: 1,
};

type TrendStatus = 'positive' | 'neutral' | 'negative';

const TREND_THEMES: Record<TrendStatus, MoodMeterPalette> = {
  positive: {
    gradient: ['#0f172a', '#2f3b8f', '#f9a826'],
    highlight: '#f8fafc',
    muted: '#e2e8f0',
    accent: '#facc15',
    meterTrack: 'rgba(248, 250, 252, 0.25)',
    meterFill: '#facc15',
  },
  neutral: {
    gradient: ['#111827', '#1f2937', '#3b82f6'],
    highlight: '#e0f2fe',
    muted: '#cbd5f5',
    accent: '#93c5fd',
    meterTrack: 'rgba(209, 213, 219, 0.3)',
    meterFill: '#93c5fd',
  },
  negative: {
    gradient: ['#1f1c2c', '#3a1c71', '#d76d77'],
    highlight: '#ffe4e6',
    muted: '#fecdd3',
    accent: '#fb7185',
    meterTrack: 'rgba(255, 255, 255, 0.2)',
    meterFill: '#fb7185',
  },
};

const trendStatus = (trend: number): TrendStatus => {
  if (trend > 0.04) return 'positive';
  if (trend < -0.04) return 'negative';
  return 'neutral';
};

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

const App: React.FC = () => {
  const [fontsLoaded] = useFonts({
    PressStart2P: PressStart2P_400Regular,
    VT323: VT323_400Regular,
  });

  const palette = TREND_THEMES[trendStatus(FINANCE_SNAPSHOT.trend)];

  if (!fontsLoaded) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.loadingContainer}>
        <ActivityIndicator color="#facc15" size="large" />
        <Text style={styles.loadingText}>Booting PixelFin...</Text>
      </LinearGradient>
    );
  }

  const statusText = FINANCE_SNAPSHOT.trend >= 0 ? 'combo streak' : 'slowdown';

  return (
    <LinearGradient colors={palette.gradient} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.balanceBlock}>
          <Text style={[styles.balanceLabel, { color: palette.muted }]}>Total Balance</Text>
          <Text style={[styles.balanceValue, { color: palette.highlight }]}>{formatCurrency(FINANCE_SNAPSHOT.balance)}</Text>
          <Text style={[styles.balanceDelta, { color: palette.accent }]}
            accessibilityLabel={`Your balance ${FINANCE_SNAPSHOT.trend >= 0 ? 'increased' : 'decreased'} by ${formatPercentage(Math.abs(FINANCE_SNAPSHOT.trend))} this week`}>
            {FINANCE_SNAPSHOT.trend >= 0 ? '▲' : '▼'} {formatPercentage(Math.abs(FINANCE_SNAPSHOT.trend))} {statusText}
          </Text>
        </View>

        <MoodMeter
          trend={FINANCE_SNAPSHOT.trend}
          savingsRate={FINANCE_SNAPSHOT.savingsRate}
          lazyDays={FINANCE_SNAPSHOT.lazyDays}
          palette={palette}
        />

        <View style={styles.actionsBlock}>
          <Text style={[styles.calloutLabel, { color: palette.muted }]}>Quick actions</Text>
          <View style={styles.buttonRow}>
            <PrimaryButton intent="expense" label="Add Expense" />
            <View style={styles.buttonSpacer} />
            <PrimaryButton intent="savings" label="Add Savings" />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'PressStart2P',
    fontSize: 12,
    letterSpacing: 1,
    color: '#facc15',
    textTransform: 'uppercase',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  balanceBlock: {
    marginBottom: 32,
  },
  balanceLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  balanceValue: {
    fontFamily: 'VT323',
    fontSize: 72,
    lineHeight: 72,
    marginBottom: 12,
  },
  balanceDelta: {
    fontFamily: 'VT323',
    fontSize: 28,
    letterSpacing: 1,
  },
  actionsBlock: {
    marginTop: 24,
  },
  calloutLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonSpacer: {
    width: 16,
  },
});

export default App;
import { ActivityIndicator, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TailwindProvider, useTailwind } from 'tailwind-rn';
import utilities from './styles.json';
import { useFonts, VT323_400Regular } from '@expo-google-fonts/vt323';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { DEFAULT_CURRENCY } from './src/constants';
import { useStorage } from './src/hooks/useStorage';

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

function HomeScreen() {
  const tw = useTailwind();
  const { loading, error, balance, trend, transactions } = useStorage();

  const changeLabel = trend.changeFromPreviousWindow;
  const signedChangeLabel = changeLabel > 0
    ? `+${formatCurrency(changeLabel)}`
    : formatCurrency(changeLabel);

  return (
    <View style={[tw('flex-1 justify-center p-4'), { backgroundColor: trend.backgroundTint }]}>
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
