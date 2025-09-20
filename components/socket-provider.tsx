"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useSession } from 'next-auth/react';

interface SocketContextType {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

const SocketContext = createContext<SocketContextType>({
  connected: false,
  connecting: false,
  error: null,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [shouldConnect, setShouldConnect] = useState(false);

  // Only connect after user is authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setShouldConnect(true);
    } else {
      setShouldConnect(false);
    }
  }, [session, status]);

  const { connected, connecting, error } = useSocket({ 
    autoConnect: shouldConnect 
  });

  return (
    <SocketContext.Provider value={{ connected, connecting, error }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}