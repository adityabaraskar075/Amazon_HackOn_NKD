
'use client';

import type { PropsWithChildren } from 'react'; // Corrected import
import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { useToast } from '@/hooks/use-toast';

const SIMULATED_OFFLINE_KEY = 'simulatedOfflineStatus';

interface NetworkStatusContextType {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  toggleSimulatedStatus: () => void;
}

const NetworkStatusContext = createContext<NetworkStatusContextType | undefined>(undefined);

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function NetworkStatusProvider({ children }: PropsWithChildren) {
  const actualIsOnline = useSyncExternalStore(subscribe, getSnapshot, () => true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const storedValue = localStorage.getItem(SIMULATED_OFFLINE_KEY);
      return storedValue === 'true';
    }
    return false;
  });
  const { toast } = useToast();

  const isOnline = actualIsOnline && !isSimulatedOffline;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleActualOnline = () => {
      if (!isSimulatedOffline) {
        toast({ title: 'Network Status', description: 'You are back online (Actual).' });
      }
    };
    const handleActualOffline = () => {
       toast({ title: 'Network Status', description: 'You are offline (Actual). Some features may be limited.', variant: 'destructive' });
    };

    window.addEventListener('online', handleActualOnline);
    window.addEventListener('offline', handleActualOffline);

    return () => {
      window.removeEventListener('online', handleActualOnline);
      window.removeEventListener('offline', handleActualOffline);
    };
  }, [toast, isSimulatedOffline, actualIsOnline]);


  const toggleSimulatedStatus = useCallback(() => {
    setIsSimulatedOffline(prev => {
      const newSimulatedStatus = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(SIMULATED_OFFLINE_KEY, String(newSimulatedStatus));
      }
      // Defer toast calls to prevent updating Toaster during NetworkStatusProvider render
      setTimeout(() => {
        if (newSimulatedStatus) {
          toast({ title: 'Network Simulation', description: 'Simulating OFFLINE mode.', variant: 'destructive' });
        } else {
           toast({ title: 'Network Simulation', description: `Simulating ONLINE mode. Actual status: ${actualIsOnline ? 'Online' : 'Offline'}.` });
        }
      }, 0);
      return newSimulatedStatus;
    });
  }, [toast, actualIsOnline]);

  return (
    <NetworkStatusContext.Provider value={{ isOnline, isSimulatedOffline, toggleSimulatedStatus }}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

export function useNetworkStatus() {
  const context = useContext(NetworkStatusContext);
  if (context === undefined) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }
  return context;
}
