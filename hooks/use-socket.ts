import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface UseSocketOptions {
  autoConnect?: boolean;
}

interface SocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export function useSocket(options: UseSocketOptions = { autoConnect: true }) {
  const { data: session } = useSession();
  const [socketState, setSocketState] = useState<SocketState>({
    connected: false,
    connecting: false,
    error: null
  });
  
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!session?.user || !options.autoConnect) return;

    const connectSocket = () => {
      if (socketRef.current?.connected) return;

      setSocketState(prev => ({ ...prev, connecting: true, error: null }));

      const socket = io({
        path: '/api/socketio',
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        if (!mountedRef.current) return;
        console.log('🔗 Socket connected');
        setSocketState({
          connected: true,
          connecting: false,
          error: null
        });
      });

      socket.on('disconnect', (reason) => {
        if (!mountedRef.current) return;
        console.log('❌ Socket disconnected:', reason);
        setSocketState(prev => ({
          ...prev,
          connected: false,
          connecting: false
        }));
      });

      socket.on('connect_error', (error) => {
        if (!mountedRef.current) return;
        console.error('🚫 Socket connection error:', error);
        setSocketState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: error.message
        }));
      });

      socketRef.current = socket;
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [session?.user, options.autoConnect]);

  const emit = (event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event: string, handler: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  };

  const off = (event: string, handler?: (data: any) => void) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event, handler);
      } else {
        socketRef.current.off(event);
      }
    }
  };

  const subscribe = {
    workOrder: (workOrderId: string) => emit('subscribe:workorder', workOrderId),
    mo: (moId: string) => emit('subscribe:mo', moId),
    stock: () => emit('subscribe:stock'),
  };

  const unsubscribe = {
    workOrder: (workOrderId: string) => emit('unsubscribe:workorder', workOrderId),
    mo: (moId: string) => emit('unsubscribe:mo', moId),
  };

  return {
    socket: socketRef.current,
    ...socketState,
    emit,
    on,
    off,
    subscribe,
    unsubscribe
  };
}

// Specific hooks for different features
export function useWorkOrderUpdates(workOrderId?: string) {
  const { on, off, subscribe, unsubscribe } = useSocket();
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    if (!workOrderId) return;

    subscribe.workOrder(workOrderId);

    const handleUpdate = (data: any) => {
      setUpdates(prev => [data, ...prev].slice(0, 50)); // Keep last 50 updates
    };

    const handleStarted = (data: any) => {
      setUpdates(prev => [{ ...data, type: 'started' }, ...prev].slice(0, 50));
    };

    const handleCompleted = (data: any) => {
      setUpdates(prev => [{ ...data, type: 'completed' }, ...prev].slice(0, 50));
    };

    on('workorder:updated', handleUpdate);
    on('workorder:started', handleStarted);
    on('workorder:completed', handleCompleted);

    return () => {
      off('workorder:updated', handleUpdate);
      off('workorder:started', handleStarted);
      off('workorder:completed', handleCompleted);
      unsubscribe.workOrder(workOrderId);
    };
  }, [workOrderId, on, off, subscribe, unsubscribe]);

  return updates;
}

export function useStockAlerts() {
  const { on, off, subscribe } = useSocket();
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    subscribe.stock();

    const handleStockUpdate = (data: any) => {
      setAlerts(prev => [data, ...prev].slice(0, 20));
    };

    const handleLowStockAlert = (data: any) => {
      setAlerts(prev => [{ ...data, type: 'low_stock' }, ...prev].slice(0, 20));
    };

    on('stock:updated', handleStockUpdate);
    on('stock:low_stock_alert', handleLowStockAlert);

    return () => {
      off('stock:updated', handleStockUpdate);
      off('stock:low_stock_alert', handleLowStockAlert);
    };
  }, [on, off, subscribe]);

  return alerts;
}

export function useDashboardUpdates() {
  const { on, off } = useSocket();
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    const handleUpdate = (data: any) => {
      setUpdates(prev => [data, ...prev].slice(0, 100));
    };

    const handleWorkOrderUpdate = (data: any) => {
      setUpdates(prev => [{ ...data, type: 'workorder' }, ...prev].slice(0, 100));
    };

    const handleMOUpdate = (data: any) => {
      setUpdates(prev => [{ ...data, type: 'mo' }, ...prev].slice(0, 100));
    };

    const handleStockUpdate = (data: any) => {
      setUpdates(prev => [{ ...data, type: 'stock' }, ...prev].slice(0, 100));
    };

    on('dashboard:update', handleUpdate);
    on('workorder:status_change', handleWorkOrderUpdate);
    on('mo:status_change', handleMOUpdate);
    on('stock:updated', handleStockUpdate);

    return () => {
      off('dashboard:update', handleUpdate);
      off('workorder:status_change', handleWorkOrderUpdate);
      off('mo:status_change', handleMOUpdate);
      off('stock:updated', handleStockUpdate);
    };
  }, [on, off]);

  return updates;
}

export function useNotifications() {
  const { on, off } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const handleNotification = (data: any) => {
      setNotifications(prev => [data, ...prev].slice(0, 10));
    };

    on('notification', handleNotification);

    return () => {
      off('notification', handleNotification);
    };
  }, [on, off]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true } 
          : notif
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    markAsRead,
    clearAll,
    unreadCount: notifications.filter(n => !n.read).length
  };
}