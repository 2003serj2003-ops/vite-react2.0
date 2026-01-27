/**
 * Cloudflare Pages Function: Управление кодами доступа
 * GET /api/admin/access-codes - список
 * POST /api/admin/access-codes - создание
 * DELETE /api/admin/access-codes - удаление
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

// GET: Список кодов
export async function onRequestGet(context: { env: Env }) {
  try {
    const supabase = createClient(
      context.env.VITE_SUPABASE_URL,
      context.env.VITE_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('access_codes')
      .select('id,code_hash,role,is_active,expires_at,max_uses,uses_count,note,display_code,created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ codes: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST: Создание нового кода
export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body = await context.request.json();
    const { code, role, max_uses, expires_at, note } = body;

    // Генерация или валидация кода
    let plainCode = code?.trim();
    if (!plainCode) {
      plainCode = Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Проверка формата
    if (!/^\d{6}$/.test(plainCode)) {
      return new Response(JSON.stringify({ error: 'Code must be 6 digits' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      context.env.VITE_SUPABASE_URL,
      context.env.VITE_SUPABASE_ANON_KEY
    );

    // Хеширование на сервере
    const codeHash = await bcrypt.hash(plainCode, 10);
    console.log('[ADMIN] Hash generated for code:', plainCode.slice(-2));

    // Маскированный код для отображения
    const displayCode = '****' + plainCode.slice(-2);

    const payload = {
      code_hash: codeHash,
      role: role || 'viewer',
      max_uses: max_uses ?? null,
      expires_at: expires_at || null,
      note: note || null,
      display_code: displayCode,
    };

    const { error } = await supabase
      .from('access_codes')
      .insert(payload);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Возвращаем код ТОЛЬКО при создании
    return new Response(JSON.stringify({
      success: true,
      code: plainCode
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE: Деактивация кода
export async function onRequestDelete(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      context.env.VITE_SUPABASE_URL,
      context.env.VITE_SUPABASE_ANON_KEY
    );

    const { error } = await supabase
      .from('access_codes')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
