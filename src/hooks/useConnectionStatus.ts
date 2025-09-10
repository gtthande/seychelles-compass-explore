import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionStatus {
  isOnline: boolean;
  isSupabaseConnected: boolean;
  lastChecked: Date | null;
  retryCount: number;
}

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    isSupabaseConnected: true,
    lastChecked: null,
    retryCount: 0,
  });

  const checkSupabaseConnection = async (): Promise<boolean> => {
    try {
      // Simple health check using a lightweight query
      const { error } = await supabase.from('categories').select('count', { count: 'exact', head: true });
      return !error;
    } catch (error) {
      console.error('Supabase connection check failed:', error);
      return false;
    }
  };

  const updateConnectionStatus = async () => {
    const isOnline = navigator.onLine;
    let isSupabaseConnected = false;

    if (isOnline) {
      isSupabaseConnected = await checkSupabaseConnection();
    }

    setStatus(prev => ({
      isOnline,
      isSupabaseConnected,
      lastChecked: new Date(),
      retryCount: isSupabaseConnected ? 0 : prev.retryCount + 1,
    }));
  };

  const forceRetry = async () => {
    await updateConnectionStatus();
  };

  useEffect(() => {
    // Initial check
    updateConnectionStatus();

    // Network status listeners
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      updateConnectionStatus();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false, isSupabaseConnected: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic health checks (every 30 seconds)
    const healthCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        updateConnectionStatus();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(healthCheckInterval);
    };
  }, []);

  return {
    ...status,
    forceRetry,
    isFullyConnected: status.isOnline && status.isSupabaseConnected,
  };
};