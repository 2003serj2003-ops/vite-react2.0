/**
 * Integration API Client
 * Handles communication with Cloudflare Functions for integration management
 */

const API_BASE = import.meta.env.PROD 
  ? 'https://uzum.2003serj2003-ops.workers.dev/api/integration'
  : 'http://localhost:8788/api/integration';

export interface IntegrationStatus {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'error';
  shop_ids?: any[];
  connected_at?: string;
  seller_meta?: any;
  token_last4?: string;
}

/**
 * Get Telegram initData for API authentication
 */
function getTelegramInitData(): string {
  return window.Telegram?.WebApp?.initData || '';
}

/**
 * GET /api/integration/status
 * Check integration status for current user
 */
export async function getIntegrationStatus(provider: string = 'uzum'): Promise<IntegrationStatus> {
  const response = await fetch(`${API_BASE}/status?provider=${provider}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': getTelegramInitData()
    }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to get integration status');
  }
  
  return response.json();
}

/**
 * POST /api/integration/connect
 * Save encrypted integration token
 */
export async function connectIntegration(data: {
  provider: string;
  token_cipher: string;
  token_iv: string;
  token_salt: string;
  token_last4?: string;
  shop_ids?: any[];
  seller_meta?: any;
}): Promise<{ success: boolean; integration: any }> {
  const response = await fetch(`${API_BASE}/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': getTelegramInitData()
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to connect integration');
  }
  
  return response.json();
}

/**
 * POST /api/integration/disconnect
 * Disconnect integration (set status to disconnected)
 */
export async function disconnectIntegration(provider: string = 'uzum'): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/disconnect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': getTelegramInitData()
    },
    body: JSON.stringify({ provider })
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to disconnect integration');
  }
  
  return response.json();
}

/**
 * GET /api/integration/health
 * Test integration connection
 */
export async function checkIntegrationHealth(provider: string = 'uzum'): Promise<{ success: boolean; message?: string }> {
  const response = await fetch(`${API_BASE}/health?provider=${provider}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': getTelegramInitData()
    }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to check integration health');
  }
  
  return response.json();
}
