// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-app.vercel.app' 
    : 'http://localhost:5173',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// JWT Configuration
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  EXPIRES_IN: '7d',
  ALGORITHM: 'HS256' as const,
};

// Session Configuration
export const SESSION_CONFIG = {
  MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
  COOKIE_NAME: 'session_token',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  },
};

// Role Permissions
export const ROLE_PERMISSIONS = {
  owner: ['*'], // все права
  admin: [
    'users:read', 'users:update', 'users:manage_roles',
    'codes:read', 'codes:create', 'codes:delete',
    'content:read', 'content:create', 'content:update', 'content:delete',
    'audit:read',
  ],
  editor: [
    'content:read', 'content:create', 'content:update',
    'codes:read', // может только просматривать коды
  ],
  viewer: [
    'content:read',
  ],
} as const;

export type Role = keyof typeof ROLE_PERMISSIONS;

// Rate Limiting
export const RATE_LIMIT = {
  CODE_CHECK: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 минут
  },
  API_CALLS: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60 * 1000, // 1 минута
  },
  LOGIN: {
    MAX_ATTEMPTS: 10,
    WINDOW_MS: 15 * 60 * 1000,
  },
};

// Supabase Admin (server-side only!)
export const SUPABASE_CONFIG = {
  URL: process.env.VITE_SUPABASE_URL || '',
  ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
  SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '', // Только на сервере!
};
