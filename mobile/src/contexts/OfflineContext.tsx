import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface OfflineContextType {
  isOnline: boolean;
  isOffline: boolean;
  connectionType: string | null;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      setConnectionType(state.type);
    });

    return () => unsubscribe();
  }, []);

  const value: OfflineContextType = {
    isOnline,
    isOffline: !isOnline,
    connectionType
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};
