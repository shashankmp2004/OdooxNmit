import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface SocketApiResponse extends NextApiResponse {
  socket: any;
}

interface SocketData {
  userId: string;
  userRole: string;
  userName: string;
}

interface CustomSocket {
  data: SocketData;
}

const SocketHandler = async (req: NextApiRequest, res: SocketApiResponse) => {
  if (res.socket.server.io) {
    console.log('Socket.io already running');
    res.end();
    return;
  }

  console.log('Setting up Socket.io...');
  const httpServer: NetServer = res.socket.server as any;
  const io = new SocketIOServer(httpServer, {
    path: '/api/socketio',
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware for Socket.io
  io.use(async (socket: any, next) => {
    try {
      const session = await getServerSession(req, res, authOptions);
      
      if (!session?.user) {
        return next(new Error('Authentication required'));
      }

      // Store user data in socket
      socket.data = {
        userId: session.user.id,
        userRole: session.user.role,
        userName: session.user.name
      };

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: any) => {
    const userData = socket.data as SocketData;
    console.log(`🔗 User connected: ${userData.userName} (${userData.userRole})`);

    // Join user to role-based rooms
    socket.join(`role:${userData.userRole}`);
    socket.join(`user:${userData.userId}`);

    // Join dashboard room for real-time updates
    socket.join('dashboard');

    // Handle work order subscriptions
    socket.on('subscribe:workorder', (workOrderId: string) => {
      socket.join(`workorder:${workOrderId}`);
      console.log(`📋 User ${userData.userName} subscribed to work order ${workOrderId}`);
    });

    // Handle manufacturing order subscriptions
    socket.on('subscribe:mo', (moId: string) => {
      socket.join(`mo:${moId}`);
      console.log(`🏭 User ${userData.userName} subscribed to MO ${moId}`);
    });

    // Handle stock alerts subscriptions
    socket.on('subscribe:stock', () => {
      socket.join('stock:alerts');
      console.log(`📦 User ${userData.userName} subscribed to stock alerts`);
    });

    // Unsubscribe from specific rooms
    socket.on('unsubscribe:workorder', (workOrderId: string) => {
      socket.leave(`workorder:${workOrderId}`);
    });

    socket.on('unsubscribe:mo', (moId: string) => {
      socket.leave(`mo:${moId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${userData.userName}`);
    });
  });

  res.socket.server.io = io;
  res.end();
};

export default SocketHandler;