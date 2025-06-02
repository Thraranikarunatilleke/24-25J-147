import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

const STYLE_CONSTANTS = {
  COLORS: {
    ERROR: {
      BACKGROUND: '#1a1a1a',
      TEXT: '#ffffff',
      MESSAGE: '#a0a0a0',
      BUTTON: '#2d2d2d',
      ICON: '#e74c3c',
    },
    TEXT: {
      WHITE: '#ffffff',
    },
  },
  SIZES: {
    ICON: 48,
    TITLE: 28,
    MESSAGE: 14,
    BUTTON_TEXT: 16,
  },
  SPACING: {
    CONTAINER: {
      PADDING: 20,
      MARGIN: 0,
      BORDER_RADIUS: 16,
    },
    ICON: {
      MARGIN: 16,
    },
    TEXT: {
      MARGIN: 8,
    },
    BUTTON: {
      PADDING_VERTICAL: 12,
      PADDING_HORIZONTAL: 24,
      MARGIN: 16,
      BORDER_RADIUS: 10,
    },
  },
};

const ConnectionStatus = ({ onRetry }) => {
  const { isBackendConnected, isCheckingConnection, checkConnection, isInitialLoading } = useAppContext();

  const handleRetry = useCallback(async () => {
    if (onRetry) {
      onRetry();
    } else {
      await checkConnection();
    }
  }, [onRetry, checkConnection]);

  const retryButtonContent = useMemo(() => (
    <Text style={styles.retryText}>
      {isCheckingConnection ? 'Connecting...' : 'Retry'}
    </Text>
  ), [isCheckingConnection]);

  const mainContent = useMemo(() => (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name="cloud-offline"
          size={STYLE_CONSTANTS.SIZES.ICON}
          color={STYLE_CONSTANTS.COLORS.ERROR.ICON}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Server Unavailable</Text>
        <Text style={styles.message}>
          Unable to connect to the emotion recognition service. Please check your connection and try again.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={handleRetry}
        disabled={isCheckingConnection}
      >
        {retryButtonContent}
      </TouchableOpacity>
    </View>
  ), [handleRetry, retryButtonContent]);

  if (isInitialLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={STYLE_CONSTANTS.COLORS.ERROR.ICON} />
        <Text style={styles.message}>Connecting to server...</Text>
      </View>
    );
  }

  if (isBackendConnected) {
    return null;
  }

  return mainContent;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: STYLE_CONSTANTS.COLORS.ERROR.BACKGROUND,
    padding: STYLE_CONSTANTS.SPACING.CONTAINER.PADDING,
    margin: STYLE_CONSTANTS.SPACING.CONTAINER.MARGIN,
    borderRadius: STYLE_CONSTANTS.SPACING.CONTAINER.BORDER_RADIUS,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2d2d2d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: STYLE_CONSTANTS.SPACING.ICON.MARGIN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: STYLE_CONSTANTS.SPACING.TEXT.MARGIN,
  },
  title: {
    color: STYLE_CONSTANTS.COLORS.ERROR.TEXT,
    fontSize: STYLE_CONSTANTS.SIZES.TITLE,
    fontWeight: '700',
    marginBottom: STYLE_CONSTANTS.SPACING.TEXT.MARGIN,
  },
  message: {
    color: STYLE_CONSTANTS.COLORS.ERROR.MESSAGE,
    fontSize: STYLE_CONSTANTS.SIZES.MESSAGE,
    textAlign: 'center',
    marginBottom: STYLE_CONSTANTS.SPACING.TEXT.MARGIN,
  },
  retryButton: {
    backgroundColor: STYLE_CONSTANTS.COLORS.ERROR.BUTTON,
    paddingVertical: STYLE_CONSTANTS.SPACING.BUTTON.PADDING_VERTICAL,
    paddingHorizontal: STYLE_CONSTANTS.SPACING.BUTTON.PADDING_HORIZONTAL,
    borderRadius: STYLE_CONSTANTS.SPACING.BUTTON.BORDER_RADIUS,
    marginTop: STYLE_CONSTANTS.SPACING.BUTTON.MARGIN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  retryText: {
    color: STYLE_CONSTANTS.COLORS.TEXT.WHITE,
    fontSize: STYLE_CONSTANTS.SIZES.BUTTON_TEXT,
    fontWeight: '600',
  },
});

export default ConnectionStatus;