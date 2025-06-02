import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './context/AppContext';

const STACK_OPTIONS = {
  headerShown: false,
};

export default function RootLayout() {
  const stackComponent = useMemo(() => (
    <Stack screenOptions={STACK_OPTIONS} />
  ), []);

  return (
    <AppProvider>
      <StatusBar style="auto" />
      {stackComponent}
    </AppProvider>
  );
}
