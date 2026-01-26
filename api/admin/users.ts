import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UpdateUserSchema } from '../_lib/schemas';
import { supabaseAdmin } from '../_lib/supabase';
import { requireAuth, logAction, handleError, setCorsHeaders, type AuthenticatedRequest } from '../_lib/middleware';

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const user = await requireAuth(req, res, 'users:read');
    if (!user) return;

    if (req.method === 'GET') {
      // Получить список пользователей
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, telegram_id, email, full_name, role, is_active, created_at, last_login_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ users: data });
    }

    if (req.method === 'PATCH') {
      // Обновить пользователя (роль/активность)
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing user ID' });
      }

      // Проверяем права на изменение ролей
      const body = UpdateUserSchema.parse(req.body);
      
      if (body.role && !['owner'].includes(user.role) && body.role === 'owner') {
        return res.status(403).json({ error: 'Only owners can assign owner role' });
      }

      // Получаем старые данные для лога
      const { data: oldUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabaseAdmin
        .from('users')
        .update(body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logAction(
        user.id,
        'update',
        'user',
        id,
        {
          old: oldUser,
          new: data,
          changes: body,
        },
        req
      );

      return res.status(200).json({ user: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return handleError(res, error, 'users');
  }
}
