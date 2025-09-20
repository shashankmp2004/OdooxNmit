import { Server as SocketIOServer } from 'socket.io';

interface SocketEmitter {
  emit: (event: string, data: any) => void;
  to: (room: string) => SocketEmitter;
}

class SocketService {
  private static instance: SocketService;
  private io: SocketIOServer | null = null;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  setIO(io: SocketIOServer) {
    this.io = io;
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }

  // Helper method to get the Socket.io instance from the global server
  private getIOInstance(): SocketIOServer | null {
    if (this.io) return this.io;
    
    // Try to get from global in development
    if (typeof global !== 'undefined' && (global as any).io) {
      return (global as any).io;
    }
    
    return null;
  }

  // Work Order Events
  emitWorkOrderUpdate(workOrderId: string, data: any) {
    const io = this.getIOInstance();
    if (io) {
      io.to(`workorder:${workOrderId}`).emit('workorder:updated', {
        workOrderId,
        data,
        timestamp: new Date().toISOString()
      });
      
      // Also emit to dashboard for general monitoring
      io.to('dashboard').emit('workorder:status_change', {
        workOrderId,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  emitWorkOrderStarted(workOrderId: string, data: any) {
    const io = this.getIOInstance();
    if (io) {
      io.to(`workorder:${workOrderId}`).emit('workorder:started', {
        workOrderId,
        data,
        timestamp: new Date().toISOString()
      });
      
      io.to('dashboard').emit('workorder:started', {
        workOrderId,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  emitWorkOrderCompleted(workOrderId: string, data: any) {
    const io = this.getIOInstance();
    if (io) {
      io.to(`workorder:${workOrderId}`).emit('workorder:completed', {
        workOrderId,
        data,
        timestamp: new Date().toISOString()
      });
      
      io.to('dashboard').emit('workorder:completed', {
        workOrderId,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Manufacturing Order Events
  emitMOUpdate(moId: string, data: any) {
    const io = this.getIOInstance();
    if (io) {
      io.to(`mo:${moId}`).emit('mo:updated', {
        moId,
        data,
        timestamp: new Date().toISOString()
      });
      
      io.to('dashboard').emit('mo:status_change', {
        moId,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  emitMOCompleted(moId: string, data: any) {
    const io = this.getIOInstance();
    if (io) {
      io.to(`mo:${moId}`).emit('mo:completed', {
        moId,
        data,
        timestamp: new Date().toISOString()
      });
      
      io.to('dashboard').emit('mo:completed', {
        moId,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Stock Events
  emitStockUpdate(productId: string, data: any) {
    const io = this.getIOInstance();
    if (io) {
      io.to('stock:alerts').emit('stock:updated', {
        productId,
        data,
        timestamp: new Date().toISOString()
      });
      
      io.to('dashboard').emit('stock:updated', {
        productId,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  emitLowStockAlert(productId: string, data: any) {
    const io = this.getIOInstance();
    if (io) {
      // Send to inventory managers and admins
      io.to('role:INVENTORY').emit('stock:low_stock_alert', {
        productId,
        data,
        timestamp: new Date().toISOString()
      });
      
      io.to('role:ADMIN').emit('stock:low_stock_alert', {
        productId,
        data,
        timestamp: new Date().toISOString()
      });
      
      io.to('role:MANAGER').emit('stock:low_stock_alert', {
        productId,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // General Dashboard Events
  emitDashboardUpdate(data: any) {
    const io = this.getIOInstance();
    if (io) {
      io.to('dashboard').emit('dashboard:update', {
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // User-specific notifications
  emitUserNotification(userId: string, notification: any) {
    const io = this.getIOInstance();
    if (io) {
      io.to(`user:${userId}`).emit('notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Role-based broadcasts
  emitToRole(role: string, event: string, data: any) {
    const io = this.getIOInstance();
    if (io) {
      io.to(`role:${role}`).emit(event, {
        data,
        timestamp: new Date().toISOString()
      });
    }
  }
}

export const socketService = SocketService.getInstance();

// Types for Socket events
export interface WorkOrderUpdateEvent {
  workOrderId: string;
  data: any;
  timestamp: string;
}

export interface MOUpdateEvent {
  moId: string;
  data: any;
  timestamp: string;
}

export interface StockUpdateEvent {
  productId: string;
  data: any;
  timestamp: string;
}

export interface NotificationEvent {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
}