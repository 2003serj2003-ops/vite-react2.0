import type { VercelRequest, VercelResponse } from '@vercel/node';
import { VerifyAccessCodeSchema } from '../_lib/schemas';
import { supabaseAdmin } from '../_lib/supabase';
import { verifyPassword, createJWT } from '../_lib/auth';
import { rateLimit, logAction, handleError, setCorsHeaders } from '../_lib/middleware';
import { RATE_LIMIT, SESSION_CONFIG } from '../_lib/config';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const identifier = Array.isArray(ip) ? ip[0] : ip;

    // Rate limiting
    if (!rateLimit(identifier, RATE_LIMIT.CODE_CHECK.MAX_ATTEMPTS, RATE_LIMIT.CODE_CHECK.WINDOW_MS)) {
      return res.status(429).json({ 
        error: 'Too many attempts. Please try again later.' 
      });
    }

    // Валидация входных данных
    const body = VerifyAccessCodeSchema.parse(req.body);
    const { code, telegram_id, full_name } = body;

    // Нормализуем код (убираем дефисы, приводим к верхнему регистру)
    const normalizedCode = code.replace(/[-\s]/g, '').toUpperCase();

    console.log('[AUTH] Verifying access code...');

    // Получаем все активные коды из БД
    const { data: codes, error: codesError } = await supabaseAdmin
      .from('access_codes')
      .select('*')
      .eq('is_disabled', false);

    if (codesError) {
      console.error('[AUTH] Error fetching codes:', codesError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!codes || codes.length === 0) {
      return res.status(401).json({ error: 'Invalid access code' });
    }

    // Проверяем каждый код (bcrypt.compare)
    let validCode: typeof codes[0] | null = null;

    for (const codeRecord of codes) {
      const isValid = await verifyPassword(normalizedCode, codeRecord.code_hash);
      if (isValid) {
        validCode = codeRecord;
        break;
      }
    }

    if (!validCode) {
      console.log('[AUTH] Invalid code provided');
      await logAction(null, 'failed_code_verification', 'access_code', null, { code: code.slice(-4) }, req);
      return res.status(401).json({ error: 'Invalid access code' });
    }

    // Проверяем срок действия
    if (validCode.expires_at && new Date(validCode.expires_at) < new Date()) {
      console.log('[AUTH] Code expired');
      return res.status(401).json({ error: 'Access code expired' });
    }

    // Проверяем лимит использований
    if (validCode.max_uses !== null && validCode.uses_count >= validCode.max_uses) {
      console.log('[AUTH] Code usage limit reached');
      return res.status(401).json({ error: 'Access code usage limit reached' });
    }

    console.log('[AUTH] Code is valid, role:', validCode.role_to_assign);

    // Создаём или обновляем пользователя
    let user;

    if (telegram_id) {
      // Проверяем существующего пользователя по telegram_id
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('telegram_id', telegram_id)
        .single();

      if (existingUser) {
        // Обновляем существующего пользователя
        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            full_name: full_name || existingUser.full_name,
            role: validCode.role_to_assign, // обновляем роль
            is_active: true,
            last_login_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('[AUTH] Error updating user:', updateError);
          return res.status(500).json({ error: 'Failed to update user' });
        }

        user = updatedUser;
        console.log('[AUTH] Existing user updated');
      } else {
        // Создаём нового пользователя
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            telegram_id,
            full_name: full_name || 'User',
            role: validCode.role_to_assign,
            is_active: true,
            last_login_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error('[AUTH] Error creating user:', createError);
          return res.status(500).json({ error: 'Failed to create user' });
        }

        user = newUser;
        console.log('[AUTH] New user created');
      }
    } else {
      // Создаём анонимного пользователя
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          full_name: full_name || 'Anonymous User',
          role: validCode.role_to_assign,
          is_active: true,
          last_login_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('[AUTH] Error creating anonymous user:', createError);
        return res.status(500).json({ error: 'Failed to create user' });
      }

      user = newUser;
      console.log('[AUTH] Anonymous user created');
    }

    // Увеличиваем счётчик использований кода
    await supabaseAdmin
      .from('access_codes')
      .update({ uses_count: validCode.uses_count + 1 })
      .eq('id', validCode.id);

    // Создаём JWT токен
    const token = createJWT({
      id: user.id,
      role: user.role,
      telegram_id: user.telegram_id,
    });

    // Сохраняем сессию в БД
    await supabaseAdmin.from('user_sessions').insert({
      user_id: user.id,
      token_hash: token,
      expires_at: new Date(Date.now() + SESSION_CONFIG.MAX_AGE).toISOString(),
      ip_address: identifier,
      user_agent: req.headers['user-agent'] || null,
    });

    // Логируем успешный вход
    await logAction(
      user.id,
      'login',
      'user',
      user.id,
      { method: 'access_code', role: user.role },
      req
    );

    console.log('[AUTH] Login successful, user:', user.id);

    // Возвращаем токен и данные пользователя
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        role: user.role,
        telegram_id: user.telegram_id,
      },
    });

  } catch (error) {
    return handleError(res, error, 'verify-code');
  }
}
