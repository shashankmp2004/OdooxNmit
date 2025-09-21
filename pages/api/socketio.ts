import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { getToken } from 'next-auth/jwt';
import { socketService } from '@/lib/socket';

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
      // Prefer stateless auth: read NextAuth JWT from cookies on the Socket handshake request
      const token = await getToken({
        // socket.request is an IncomingMessage and acceptable here
        req: socket.request as any,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token || !token.sub) {
        return next(new Error('Authentication required'));
      }

      // Store user data in socket
      socket.data = {
        userId: (token as any).id || token.sub,
        userRole: (token as any).role,
        userName: (token as any).name || '',
      } as SocketData;

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

  // Expose the io instance to the Next.js server and to our emitter service
  res.socket.server.io = io;
  ;(global as any).io = io;
  socketService.setIO(io);
  res.end();
};

export default SocketHandler;