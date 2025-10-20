import React from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TailwindProvider, useTailwind } from 'tailwind-rn';
import utilities from './styles.json';
import { useFonts, VT323_400Regular } from '@expo-google-fonts/vt323';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { DEFAULT_CURRENCY, ONE_TAP_DECREMENT, ONE_TAP_INCREMENT } from './src/constants';

function HomeScreen() {
  const tw = useTailwind();
  return (
    <View style={tw('flex-1 items-center justify-center bg-bg p-4')}>
      <Text
        style={[tw('text-white text-center text-4xl'), { fontFamily: 'VT323_400Regular' }]}
      >
        PixelFin
      </Text>
      <Text
        style={[tw('text-white text-center mt-2'), { fontFamily: 'PressStart2P_400Regular', fontSize: 12 }]}
      >
        Default currency: {DEFAULT_CURRENCY}
      </Text>
      <Text
        style={[tw('text-white text-center mt-2'), { fontFamily: 'PressStart2P_400Regular', fontSize: 12 }]}
      >
        One-tap: +${ONE_TAP_INCREMENT} save • -${ONE_TAP_DECREMENT} spend
      </Text>
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
