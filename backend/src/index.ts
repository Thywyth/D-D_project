import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

// ─── Import Models (registers Mongoose schemas) ───────────────────
import './models/User.js';
import './models/Room.js';
import './models/Character.js';
import './models/MapMarker.js';
import './models/FamilyTree.js';
import './models/Notebook.js';

// ─── Import Routes ────────────────────────────────────────────────
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import characterRoutes from './routes/characters.js';
import mapRoutes from './routes/maps.js';
import treeRoutes from './routes/trees.js';
import diceRoutes from './routes/dice.js';
import notebookRoutes from './routes/notebooks.js';

// ─── Import Socket Handlers ──────────────────────────────────────
import { initializeSocketHandlers } from './sockets/index.js';

const app = express();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// ─── Middleware ────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));

// ─── REST API Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/dice', diceRoutes);
app.use('/api/notebooks', notebookRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    routes: [
      '/api/auth',
      '/api/rooms',
      '/api/characters',
      '/api/maps',
      '/api/trees',
      '/api/dice',
      '/api/notebooks',
    ],
  });
});

// 404 handler for undefined routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Маршрут не знайдено.' });
});

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error('[Server] Unhandled error:', err.message);
    res.status(500).json({
      error: env.NODE_ENV === 'development' ? err.message : 'Внутрішня помилка сервера.',
    });
  },
);

// ─── Socket.IO ────────────────────────────────────────────────────
initializeSocketHandlers(io);

// ─── Bootstrap ────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  await connectDB();

  httpServer.listen(env.PORT, () => {
    console.log(`[Server] DnD VTT Backend running on port ${env.PORT}`);
    console.log(`[Server] Environment: ${env.NODE_ENV}`);
    console.log(`[Server] CORS origin: ${env.CORS_ORIGIN}`);
    console.log('[Server] REST routes: /api/{auth,rooms,characters,maps,trees,dice}');
    console.log('[Server] Socket.IO: JWT-authenticated, room-based');
  });
}

bootstrap().catch((error) => {
  console.error('[Server] Failed to start:', error);
  process.exit(1);
});

// ─── Graceful Shutdown ────────────────────────────────────────────
const shutdown = async (): Promise<void> => {
  console.log('[Server] Shutting down gracefully...');
  io.close();
  await disconnectDB();

  httpServer.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => { void shutdown(); });
process.on('SIGINT', () => { void shutdown(); });

export { app, httpServer, io };
