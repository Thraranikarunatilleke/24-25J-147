import React from 'react';
import { View, StyleSheet } from 'react-native';
import RealtimeCameraView from './components/RealtimeCameraView';
import ConnectionStatus from './components/ConnectionStatus';
import { useAppContext } from './context/AppContext';

export default function Index() {
  const { isBackendConnected } = useAppContext();

  return (
    <View style={styles.container}>
      {!isBackendConnected && <ConnectionStatus />}
      <RealtimeCameraView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
