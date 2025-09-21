// Adapter interface to abstract the realtime layer (Socket.IO or Vercel Realtime)

export type Handler = (data: any) => void;

export interface RealtimeClient {
  connect: () => Promise<void> | void;
  disconnect: () => void;
  on: (event: string, handler: Handler) => void;
  off: (event: string, handler?: Handler) => void;
  emit: (event: string, payload?: any) => void;
  // Channel helpers reflect current semantics
  subscribeWorkOrder: (id: string) => void;
  unsubscribeWorkOrder: (id: string) => void;
  subscribeMO: (id: string) => void;
  unsubscribeMO: (id: string) => void;
  subscribeStock: () => void;
}

// Default implementation proxies to existing Socket.IO hook runtime.
// We'll swap this to Vercel Realtime client once enabled.
import { io, Socket } from 'socket.io-client';

export class SocketIOClient implements RealtimeClient {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;
    this.socket = io({ path: '/api/socketio', transports: ['websocket', 'polling'] });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: string, handler: Handler) { this.socket?.on(event, handler); }
  off(event: string, handler?: Handler) { handler ? this.socket?.off(event, handler) : this.socket?.off(event); }
  emit(event: string, payload?: any) { this.socket?.emit(event, payload); }
  subscribeWorkOrder(id: string) { this.emit('subscribe:workorder', id); }
  unsubscribeWorkOrder(id: string) { this.emit('unsubscribe:workorder', id); }
  subscribeMO(id: string) { this.emit('subscribe:mo', id); }
  unsubscribeMO(id: string) { this.emit('unsubscribe:mo', id); }
  subscribeStock() { this.emit('subscribe:stock'); }
}

export function getRealtimeClient(): RealtimeClient {
  return new SocketIOClient();
}
