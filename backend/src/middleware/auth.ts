/**
 * JWT Authentication Middleware
 *
 * Verifies Bearer token from Authorization header.
 * Attaches decoded user info to req.user for downstream handlers.
 * Also provides a Socket.IO handshake authenticator.
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';
import { env } from '../config/env.js';

// ─── Augment Express Request ──────────────────────────────────────

export interface AuthUser {
  userId: string;
  email: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ─── Express Middleware ───────────────────────────────────────────

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Не авторизовано. Токен відсутній.' });
    return;
  }

  const token = authHeader.slice(7); // Remove 'Bearer '

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    const message =
      error instanceof jwt.TokenExpiredError
        ? 'Токен закінчився. Увійдіть знову.'
        : 'Невірний токен авторизації.';
    res.status(401).json({ error: message });
  }
}

// ─── Socket.IO Auth ───────────────────────────────────────────────

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    email: string;
    username: string;
  };
}

/**
 * Verify JWT from Socket.IO handshake auth.
 * Usage: io.use(socketAuthMiddleware)
 */
export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): void {
  const token = socket.handshake.auth['token'] as string | undefined;

  if (!token) {
    next(new Error('Не авторизовано. Токен відсутній.'));
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    socket.data['userId'] = decoded.userId;
    socket.data['email'] = decoded.email;
    socket.data['username'] = decoded.username;
    next();
  } catch {
    next(new Error('Невірний токен авторизації.'));
  }
}

// ─── JWT Token Generation ─────────────────────────────────────────

export function generateToken(user: {
  _id: string;
  email: string;
  username: string;
}): string {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      username: user.username,
    },
    env.JWT_SECRET,
    { expiresIn: '7d' },
  );
}
