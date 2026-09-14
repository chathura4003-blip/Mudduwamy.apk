import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';

export interface DbChangeEvent {
  table: string;
  action: 'create' | 'update' | 'delete' | 'reset' | string;
  id?: string;
  data?: any;
  actor?: string;
  timestamp: string;
}

export interface ActivityEvent {
  id: string;
  actor: string;
  userName?: string;
  action: string;
  details?: string;
  category: string;
  actorRole: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface SocketContextType {
  socket: any | null;
  isConnected: boolean;
  lastDbChange: DbChangeEvent | null;
  lastActivity: ActivityEvent | null;
  subscribeToTable: (table: string, callback: (change: DbChangeEvent) => void) => () => void;
  broadcastDbChange: (table: string, action: string, data?: any, id?: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: true,
  lastDbChange: null,
  lastActivity: null,
  subscribeToTable: () => () => {},
  broadcastDbChange: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastDbChange, setLastDbChange] = useState<DbChangeEvent | null>(null);
  const [lastActivity, setLastActivity] = useState<ActivityEvent | null>(null);
  const listenersRef = useRef<Map<string, Set<(change: DbChangeEvent) => void>>>(new Map());
  const channelRef = useRef<BroadcastChannel | null>(null);

  const handleIncomingDbChange = useCallback((event: DbChangeEvent) => {
    setLastDbChange(event);

    if (event && event.table) {
      const tableListeners = listenersRef.current.get(event.table);
      if (tableListeners) {
        tableListeners.forEach((cb) => {
          try {
            cb(event);
          } catch (err) {
            console.error('Error in table listener:', err);
          }
        });
      }

      const allListeners = listenersRef.current.get('*');
      if (allListeners) {
        allListeners.forEach((cb) => {
          try {
            cb(event);
          } catch (err) {
            console.error('Error in all-tables listener:', err);
          }
        });
      }

      window.dispatchEvent(new CustomEvent('database-changed', { detail: event }));
      window.dispatchEvent(new CustomEvent('site-data-updated', { detail: event }));

      if (['users', 'teachers', 'students'].includes(event.table)) {
        window.dispatchEvent(new CustomEvent('users-data-updated', { detail: event }));
      }
      if (['classes', 'subjects'].includes(event.table)) {
        window.dispatchEvent(new CustomEvent('curriculum-updated', { detail: event }));
      }
      if (['exams', 'submissions'].includes(event.table)) {
        window.dispatchEvent(new CustomEvent('exams-updated', { detail: event }));
      }
      if (['materials', 'study_materials'].includes(event.table)) {
        window.dispatchEvent(new CustomEvent('materials-updated', { detail: event }));
      }
      if (['notices', 'broadcast_notices'].includes(event.table)) {
        window.dispatchEvent(new CustomEvent('notices-updated', { detail: event }));
      }
      if (['admissions'].includes(event.table)) {
        window.dispatchEvent(new CustomEvent('admissions-updated', { detail: event }));
      }
    }
  }, []);

  useEffect(() => {
    // Cross-tab real-time event bus via BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('pirivena-realtime-bus');
        channelRef.current = channel;

        channel.onmessage = (msgEvent) => {
          const payload = msgEvent.data;
          if (payload?.type === 'db:change' && payload.event) {
            handleIncomingDbChange(payload.event);
          } else if (payload?.type === 'activity:new' && payload.activity) {
            setLastActivity(payload.activity);
            window.dispatchEvent(new CustomEvent('activity-stream-event', { detail: payload.activity }));
          }
        };
      }
    } catch (e) {
      // Ignore broadcast channel errors
    }

    const handleLocalDbChange = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail) {
        handleIncomingDbChange(detail);
      }
    };

    window.addEventListener('local-db-change', handleLocalDbChange as EventListener);

    return () => {
      window.removeEventListener('local-db-change', handleLocalDbChange as EventListener);
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
    };
  }, [handleIncomingDbChange]);

  const subscribeToTable = useCallback((table: string, callback: (change: DbChangeEvent) => void) => {
    if (!listenersRef.current.has(table)) {
      listenersRef.current.set(table, new Set());
    }
    listenersRef.current.get(table)!.add(callback);

    return () => {
      const set = listenersRef.current.get(table);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          listenersRef.current.delete(table);
        }
      }
    };
  }, []);

  const broadcastDbChange = useCallback((table: string, action: string, data?: any, id?: string) => {
    const event: DbChangeEvent = {
      table,
      action,
      data,
      id,
      timestamp: new Date().toISOString(),
    };

    handleIncomingDbChange(event);

    if (channelRef.current) {
      try {
        channelRef.current.postMessage({ type: 'db:change', event });
      } catch (e) {}
    }
  }, [handleIncomingDbChange]);

  return (
    <SocketContext.Provider
      value={{
        socket: null,
        isConnected,
        lastDbChange,
        lastActivity,
        subscribeToTable,
        broadcastDbChange,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
