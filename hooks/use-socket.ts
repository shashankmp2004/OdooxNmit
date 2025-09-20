'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface SocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface UseSocketReturn {
  socket: WebSocket | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  send: (data: any) => void;
  disconnect: () => void;
  connect: () => void;
}

export function useSocket(options: SocketOptions = {}): UseSocketReturn {
  const { data: session } = useSession();
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 3000,
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (connecting || connected) return;

    setConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        setSocket(ws);
        setConnected(true);
        setConnecting(false);
        setError(null);
        reconnectCount.current = 0;
        
        // Send authentication if session exists
        if (session?.user) {
          ws.send(JSON.stringify({
            type: 'auth',
            data: { userId: session.user.id, token: session.user.email }
          }));
        }
      };

      ws.onclose = () => {
        setSocket(null);
        setConnected(false);
        setConnecting(false);
        
        // Attempt reconnection
        if (reconnectCount.current < reconnectAttempts) {
          reconnectCount.current++;
          reconnectTimer.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      };

      ws.onerror = (event) => {
        setError('WebSocket connection error');
        setConnecting(false);
      };

    } catch (err) {
      setError('Failed to create WebSocket connection');
      setConnecting(false);
    }
  }, [url, connecting, connected, session, reconnectAttempts, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    
    if (socket) {
      socket.close();
    }
    
    setSocket(null);
    setConnected(false);
    setConnecting(false);
    reconnectCount.current = 0;
  }, [socket]);

  const send = useCallback((data: any) => {
    if (socket && connected) {
      socket.send(JSON.stringify(data));
    }
  }, [socket, connected]);

  useEffect(() => {
    if (autoConnect && session) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, session, connect, disconnect]);

  return {
    socket,
    connected,
    connecting,
    error,
    send,
    disconnect,
    connect,
  };
}

// Dashboard-specific hook
export function useDashboardUpdates() {
  const { socket, connected, send } = useSocket({
    autoConnect: true,
  });

  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'dashboard_metrics':
            setMetrics(message.data);
            break;
          case 'orders_update':
            setOrders(message.data);
            break;
        }
      } catch (error) {
        console.error('Error parsing socket message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    
    // Request initial data
    if (connected) {
      send({ type: 'subscribe', channel: 'dashboard' });
    }

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, connected, send]);

  return { metrics, orders, connected };
}

// Notifications hook
export function useNotifications() {
  const { socket, connected, send } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'notification') {
          setNotifications(prev => [message.data, ...prev].slice(0, 50));
        }
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    
    if (connected) {
      send({ type: 'subscribe', channel: 'notifications' });
    }

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, connected, send]);

  return { notifications, connected };
}

// Stock alerts hook
export function useStockAlerts() {
  const { socket, connected, send } = useSocket();
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'stock_alert') {
          setAlerts(prev => [message.data, ...prev].slice(0, 20));
        }
      } catch (error) {
        console.error('Error parsing stock alert:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    
    if (connected) {
      send({ type: 'subscribe', channel: 'stock_alerts' });
    }

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, connected, send]);

  return { alerts, connected };
}