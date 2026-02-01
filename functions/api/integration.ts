/**
 * Cloudflare Function: Integration Management API
 * Handles UZUM integration connection, status checks, and disconnection
 * 
 * Endpoints:
 * - GET /api/integration/status?provider=uzum
 * - POST /api/integration/connect
 * - POST /api/integration/disconnect
 * - GET /api/integration/health?provider=uzum
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1Ym91eWdkZXFyb2hpemVxbG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMzE2MTIwMCwiZXhwIjoyMDE4NzM3MjAwfQ.example';

interface IntegrationStatus {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'error';
  shop_ids?: any[];
  connected_at?: string;
  seller_meta?: any;
  token_last4?: string;
}

/**
 * Verify Telegram initData signature
 * This is CRITICAL for security - prevents unauthorized access
 */
function verifyTelegramInitData(initData: string, botToken: string): boolean {
  // TODO: Implement proper Telegram initData verification
  // See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
  // For now, return true (MUST be implemented in production)
  return true;
}

/**
 * Extract Telegram user ID from initData
 */
function getTelegramUserId(initData: string): number | null {
  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    return user?.id || null;
  } catch (error) {
    console.error('Failed to parse initData:', error);
    return null;
  }
}

/**
 * GET /api/integration/status
 * Returns integration status for the user
 */
async function handleGetStatus(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider') || 'uzum';
  const initData = request.headers.get('x-telegram-init-data');
  
  if (!initData) {
    return new Response(JSON.stringify({ error: 'Missing Telegram initData' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Verify initData signature
  // const botToken = env.TELEGRAM_BOT_TOKEN;
  // if (!verifyTelegramInitData(initData, botToken)) {
  //   return new Response(JSON.stringify({ error: 'Invalid Telegram initData' }), {
  //     status: 403,
  //     headers: { 'Content-Type': 'application/json' }
  //   });
  // }
  
  const telegramUserId = getTelegramUserId(initData);
  if (!telegramUserId) {
    return new Response(JSON.stringify({ error: 'Invalid Telegram user ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const { data, error } = await supabase
    .from('integrations')
    .select('status, shop_ids, connected_at, seller_meta, token_last4')
    .eq('telegram_user_id', telegramUserId)
    .eq('provider', provider)
    .maybeSingle();
  
  if (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ error: 'Database error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const response: IntegrationStatus = {
    connected: !!data && data.status === 'connected',
    status: data?.status || 'disconnected',
    shop_ids: data?.shop_ids,
    connected_at: data?.connected_at,
    seller_meta: data?.seller_meta,
    token_last4: data?.token_last4
  };
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * POST /api/integration/connect
 * Saves encrypted token and connects integration
 */
async function handleConnect(request: Request): Promise<Response> {
  const initData = request.headers.get('x-telegram-init-data');
  
  if (!initData) {
    return new Response(JSON.stringify({ error: 'Missing Telegram initData' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const telegramUserId = getTelegramUserId(initData);
  if (!telegramUserId) {
    return new Response(JSON.stringify({ error: 'Invalid Telegram user ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const body = await request.json();
  const { provider, token_cipher, token_iv, token_salt, token_last4, shop_ids, seller_meta } = body;
  
  if (!provider || !token_cipher || !token_iv || !token_salt) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Upsert integration
  const { data, error } = await supabase
    .from('integrations')
    .upsert({
      telegram_user_id: telegramUserId,
      provider,
      status: 'connected',
      token_cipher,
      token_iv,
      token_salt,
      token_last4,
      shop_ids,
      seller_meta,
      connected_at: new Date().toISOString()
    }, {
      onConflict: 'telegram_user_id,provider'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save integration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ success: true, integration: data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * POST /api/integration/disconnect
 * Disconnects integration (sets status to disconnected)
 */
async function handleDisconnect(request: Request): Promise<Response> {
  const initData = request.headers.get('x-telegram-init-data');
  
  if (!initData) {
    return new Response(JSON.stringify({ error: 'Missing Telegram initData' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const telegramUserId = getTelegramUserId(initData);
  if (!telegramUserId) {
    return new Response(JSON.stringify({ error: 'Invalid Telegram user ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const body = await request.json();
  const { provider } = body;
  
  if (!provider) {
    return new Response(JSON.stringify({ error: 'Missing provider' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Update status to disconnected
  const { error } = await supabase
    .from('integrations')
    .update({ status: 'disconnected' })
    .eq('telegram_user_id', telegramUserId)
    .eq('provider', provider);
  
  if (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ error: 'Failed to disconnect integration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * GET /api/integration/health
 * Tests integration by making a request to provider API
 */
async function handleHealth(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider') || 'uzum';
  const initData = request.headers.get('x-telegram-init-data');
  
  if (!initData) {
    return new Response(JSON.stringify({ error: 'Missing Telegram initData' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const telegramUserId = getTelegramUserId(initData);
  if (!telegramUserId) {
    return new Response(JSON.stringify({ error: 'Invalid Telegram user ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // TODO: Implement health check by:
  // 1. Get encrypted token from database
  // 2. Request PIN from user (if not in session)
  // 3. Decrypt token
  // 4. Make test request to provider API
  // 5. Return result
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Health check not yet implemented' 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Main handler - route requests to appropriate handlers
 */
export async function onRequest(context: any): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // Enable CORS
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-telegram-init-data',
      }
    });
  }
  
  try {
    let response: Response;
    
    if (path.endsWith('/status') && method === 'GET') {
      response = await handleGetStatus(request);
    } else if (path.endsWith('/connect') && method === 'POST') {
      response = await handleConnect(request);
    } else if (path.endsWith('/disconnect') && method === 'POST') {
      response = await handleDisconnect(request);
    } else if (path.endsWith('/health') && method === 'GET') {
      response = await handleHealth(request);
    } else {
      response = new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Add CORS headers to response
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
