/**
 * Auth Controller — Registration, Login, Current User
 */

import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  sanitizeString,
} from '../utils/validators.js';

/** POST /api/auth/register */
export async function register(req: Request, res: Response): Promise<void> {
  const { username, email, password } = req.body as {
    username?: string;
    email?: string;
    password?: string;
  };

  if (!username || !email || !password) {
    res.status(400).json({ error: "Всі поля обов'язкові." });
    return;
  }

  const usernameError = isValidUsername(sanitizeString(username));
  if (usernameError) {
    res.status(400).json({ error: usernameError });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Невірний формат email.' });
    return;
  }

  const passwordError = isValidPassword(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  // Check for existing user
  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: sanitizeString(username) }],
  });

  if (existingUser) {
    const field =
      existingUser.email === email.toLowerCase() ? 'Email' : "Ім'я користувача";
    res.status(409).json({ error: `${field} вже зайнято.` });
    return;
  }

  const user = new User({
    username: sanitizeString(username),
    email: email.toLowerCase(),
    passwordHash: password, // Pre-save hook will hash it
  });

  await user.save();

  const token = generateToken({
    _id: user._id.toString(),
    email: user.email,
    username: user.username,
  });

  res.status(201).json({
    token,
    user: {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    },
  });
}

/** POST /api/auth/login */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: 'Email та пароль обов\'язкові.' });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+passwordHash',
  );

  if (!user) {
    res.status(401).json({ error: 'Невірний email або пароль.' });
    return;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401).json({ error: 'Невірний email або пароль.' });
    return;
  }

  const token = generateToken({
    _id: user._id.toString(),
    email: user.email,
    username: user.username,
  });

  res.json({
    token,
    user: {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    },
  });
}

/** GET /api/auth/me */
export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Не авторизовано.' });
    return;
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    res.status(404).json({ error: 'Користувача не знайдено.' });
    return;
  }

  res.json({
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  });
}
