import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { checkServerHealth } from '../services/api';

const CONNECTION_CHECK_INTERVAL = 30000;

const AppContext = createContext(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [lastConnectionCheck, setLastConnectionCheck] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const checkConnection = useCallback(async () => {
    setIsCheckingConnection(true);
    try {
      const healthResponse = await checkServerHealth();
      const isConnected = healthResponse.status === 'healthy';
      setIsBackendConnected(isConnected);
      setLastConnectionCheck(new Date());
      return isConnected;
    } catch (error) {
      console.error('Failed to connect to backend:', error);
      setIsBackendConnected(false);
      setLastConnectionCheck(new Date());
      return false;
    } finally {
      setIsCheckingConnection(false);
      setIsInitialLoading(false);
    }
  }, []);

  // Check connection on initial load and periodically
  useEffect(() => {
    let intervalId;

    const setupConnectionCheck = async () => {
      await checkConnection();
      intervalId = setInterval(checkConnection, CONNECTION_CHECK_INTERVAL);
    };

    setupConnectionCheck();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [checkConnection]);

  const contextValue = useMemo(() => ({
    isBackendConnected,
    isCheckingConnection,
    lastConnectionCheck,
    checkConnection,
    isInitialLoading,
  }), [isBackendConnected, isCheckingConnection, lastConnectionCheck, checkConnection, isInitialLoading]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default {
  AppProvider,
  useAppContext
};