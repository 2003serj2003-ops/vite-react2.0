import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from './config';
import type { User } from './schemas';

const SALT_ROUNDS = 10;

/**
 * Хеширование пароля/кода с помощью bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Проверка пароля/кода
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Создание JWT токена для пользователя
 */
export function createJWT(user: Pick<User, 'id' | 'role' | 'telegram_id'>): string {
  const payload = {
    userId: user.id,
    role: user.role,
    telegramId: user.telegram_id,
  };

  return jwt.sign(payload, JWT_CONFIG.SECRET, {
    expiresIn: JWT_CONFIG.EXPIRES_IN,
    algorithm: JWT_CONFIG.ALGORITHM,
  });
}

/**
 * Верификация JWT токена
 */
export function verifyJWT(token: string): {
  userId: string;
  role: string;
  telegramId: number | null;
} | null {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET, {
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as any;

    return {
      userId: decoded.userId,
      role: decoded.role,
      telegramId: decoded.telegramId || null,
    };
  } catch (error) {
    console.error('[AUTH] JWT verification failed:', error);
    return null;
  }
}

/**
 * Генерация случайного кода доступа
 */
export function generateAccessCode(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Форматируем как XXXX-XXXX-XXXX для удобства
  return code.match(/.{1,4}/g)?.join('-') || code;
}

/**
 * Проверка прав доступа пользователя
 */
export function hasPermission(userRole: string, requiredPermission: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    owner: ['*'], // все права
    admin: [
      'users:read', 'users:update', 'users:manage_roles',
      'codes:read', 'codes:create', 'codes:delete',
      'content:read', 'content:create', 'content:update', 'content:delete',
      'audit:read',
    ],
    editor: [
      'content:read', 'content:create', 'content:update',
      'codes:read',
    ],
    viewer: ['content:read'],
  };

  const permissions = rolePermissions[userRole] || [];
  
  // Если есть '*', то все права
  if (permissions.includes('*')) return true;
  
  // Проверяем точное совпадение или паттерн
  return permissions.some(p => {
    if (p === requiredPermission) return true;
    // Поддержка wildcard: users:* разрешает users:read, users:update и т.д.
    if (p.endsWith(':*')) {
      const prefix = p.slice(0, -2);
      return requiredPermission.startsWith(prefix + ':');
    }
    return false;
  });
}
