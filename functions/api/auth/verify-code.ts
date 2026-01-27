/**
 * Cloudflare Pages Function: Проверка кода доступа
 * POST /api/auth/verify-code
 */

import { createClient } from '@supabase/supabase-js';

interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

// Хеширование с использованием Web Crypto API (совместимо с Cloudflare Workers)
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { code } = await context.request.json();

    if (!code || typeof code !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid code format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Инициализация Supabase
    const supabase = createClient(
      context.env.VITE_SUPABASE_URL,
      context.env.VITE_SUPABASE_ANON_KEY
    );

    // Хешируем введённый код
    const inputHash = await hashCode(code);
    console.log('[AUTH] Checking code hash...');

    // Получаем код по хешу
    const { data: codes, error: codesError } = await supabase
      .from('access_codes')
      .select('id,code_hash,role,is_active,expires_at,max_uses,uses_count')
      .eq('is_active', true)
      .eq('code_hash', inputHash);

    if (codesError) {
      console.error('[AUTH] DB error:', codesError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!codes || codes.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid access code' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validCode = codes[0];

    // Проверка срока действия
    if (validCode.expires_at && new Date(validCode.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Code expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Проверка лимита использований
    if (validCode.max_uses !== null && validCode.uses_count >= validCode.max_uses) {
      return new Response(JSON.stringify({ error: 'Usage limit reached' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Увеличиваем счётчик
    await supabase
      .from('access_codes')
      .update({ uses_count: validCode.uses_count + 1 })
      .eq('code_hash', validCode.code_hash);

    return new Response(JSON.stringify({
      success: true,
      user: {
        role: validCode.role
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[AUTH] Exception:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
