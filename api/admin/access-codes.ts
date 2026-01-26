import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CreateAccessCodeSchema } from '../_lib/schemas';
import { supabaseAdmin } from '../_lib/supabase';
import { hashPassword, generateAccessCode } from '../_lib/auth';
import { requireAuth, logAction, handleError, setCorsHeaders, type AuthenticatedRequest } from '../_lib/middleware';

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Требуем авторизацию и права на управление кодами
    const user = await requireAuth(req, res, 'codes:create');
    if (!user) return;

    if (req.method === 'GET') {
      // Получить список кодов (без самих кодов, только метаданные)
      const { data, error } = await supabaseAdmin
        .from('access_codes')
        .select('id, role_to_assign, max_uses, uses_count, expires_at, is_disabled, created_at, note')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ codes: data });
    }

    if (req.method === 'POST') {
      // Создать новый код
      const body = CreateAccessCodeSchema.parse(req.body);
      
      // Генерируем код
      const plainCode = generateAccessCode(12);
      const codeHash = await hashPassword(plainCode.replace(/[-\s]/g, '').toUpperCase());

      const { data, error } = await supabaseAdmin
        .from('access_codes')
        .insert({
          code_hash: codeHash,
          role_to_assign: body.role_to_assign,
          max_uses: body.max_uses,
          expires_at: body.expires_at,
          note: body.note,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await logAction(user.id, 'create', 'access_code', data.id, { role: body.role_to_assign }, req);

      // Возвращаем код ТОЛЬКО один раз при создании
      return res.status(201).json({
        code: plainCode, // !!! Показываем только при создании
        id: data.id,
        role_to_assign: data.role_to_assign,
        expires_at: data.expires_at,
        max_uses: data.max_uses,
      });
    }

    if (req.method === 'DELETE') {
      // Удалить/деактивировать код
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing code ID' });
      }

      const { error } = await supabaseAdmin
        .from('access_codes')
        .update({ is_disabled: true })
        .eq('id', id);

      if (error) throw error;

      await logAction(user.id, 'delete', 'access_code', id, {}, req);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return handleError(res, error, 'access-codes');
  }
}
