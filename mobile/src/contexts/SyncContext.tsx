import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import syncService, { SyncResult, SyncStatus } from '../services/syncService';
import { useOffline } from './OfflineContext';

interface SyncContextType {
  isSyncing: boolean;
  syncStatus: SyncStatus | null;
  syncAll: () => Promise<SyncResult>;
  lastSync: Date | null;
  hasUnsyncedData: boolean;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { isOnline } = useOffline();
  const queryClient = useQueryClient();

  // Get sync status
  const { data: syncStatus, refetch: refetchSyncStatus } = useQuery(
    'syncStatus',
    () => syncService.getSyncStatus(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      enabled: isOnline
    }
  );

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && syncStatus && (syncStatus.unsyncedReadings > 0 || syncStatus.unsyncedFaults > 0)) {
      syncAll();
    }
  }, [isOnline, syncStatus]);

  const syncMutation = useMutation(
    () => syncService.syncAll(),
    {
      onMutate: () => {
        setIsSyncing(true);
      },
      onSuccess: (result) => {
        if (result.success) {
          setLastSync(new Date());
          // Invalidate relevant queries to refresh data
          queryClient.invalidateQueries('readings');
          queryClient.invalidateQueries('faults');
          queryClient.invalidateQueries('stations');
          refetchSyncStatus();
        }
      },
      onError: (error) => {
        console.error('Sync error:', error);
      },
      onSettled: () => {
        setIsSyncing(false);
      }
    }
  );

  const syncAll = async (): Promise<SyncResult> => {
    if (isSyncing) {
      throw new Error('Sync already in progress');
    }
    
    return syncMutation.mutateAsync();
  };

  const hasUnsyncedData = syncStatus ? 
    (syncStatus.unsyncedReadings > 0 || syncStatus.unsyncedFaults > 0) : false;

  const value: SyncContextType = {
    isSyncing,
    syncStatus: syncStatus || null,
    syncAll,
    lastSync,
    hasUnsyncedData
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};
