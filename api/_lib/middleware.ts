import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyJWT, hasPermission } from './auth';
import { supabaseAdmin } from './supabase';
import type { User } from './schemas';

export interface AuthenticatedRequest extends VercelRequest {
  user?: User;
  session?: {
    userId: string;
    role: string;
    telegramId: number | null;
  };
}

/**
 * Middleware для проверки авторизации
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: VercelResponse,
  requiredPermission?: string
): Promise<User | null> {
  try {
    // Получаем токен из cookie или заголовка
    const token = 
      req.cookies?.session_token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return null;
    }

    // Верифицируем JWT
    const session = verifyJWT(token);
    if (!session) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return null;
    }

    // Получаем пользователя из БД
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', session.userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      res.status(401).json({ error: 'Unauthorized: User not found or inactive' });
      return null;
    }

    // Проверяем права доступа
    if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
      res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions',
        required: requiredPermission,
        userRole: user.role,
      });
      return null;
    }

    // Сохраняем пользователя в req
    req.user = user as User;
    req.session = session;

    // Обновляем last_activity
    await supabaseAdmin
      .from('user_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('token_hash', token);

    return user as User;
  } catch (error) {
    console.error('[AUTH] Error in requireAuth:', error);
    res.status(500).json({ error: 'Internal server error' });
    return null;
  }
}

/**
 * Rate limiting в памяти (для production использовать Redis)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Логирование действий в audit_log
 */
export async function logAction(
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId?: string | null,
  details?: Record<string, any>,
  req?: VercelRequest
) {
  try {
    const ip = req?.headers['x-forwarded-for'] || req?.headers['x-real-ip'] || null;
    const userAgent = req?.headers['user-agent'] || null;

    await supabaseAdmin.from('audit_log').insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      ip_address: Array.isArray(ip) ? ip[0] : ip,
      user_agent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
    });
  } catch (error) {
    console.error('[AUDIT] Failed to log action:', error);
    // Не падаем, если логирование не удалось
  }
}

/**
 * Обработка ошибок
 */
export function handleError(res: VercelResponse, error: any, context: string) {
  console.error(`[ERROR] ${context}:`, error);

  if (error.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: error.errors,
    });
  }

  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}

/**
 * CORS headers для API
 */
export function setCorsHeaders(res: VercelResponse) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://your-app.vercel.app', // замените на свой домен
  ];

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins.join(','));
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );
}

/**
 * Sanitize HTML для защиты от XSS
 */
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
  });
}
