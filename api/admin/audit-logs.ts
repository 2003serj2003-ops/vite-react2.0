import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, logAction, handleError, setCorsHeaders, type AuthenticatedRequest } from '../_lib/middleware';

/**
 * Получить логи аудита
 * Требует права: audit:read
 */
export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await requireAuth(req, res, 'audit:read');
    if (!user) return;

    const { limit = '100', offset = '0', userId, resourceType } = req.query;

    let query = supabaseAdmin
      .from('audit_log')
      .select(`
        *,
        users:user_id (full_name, role)
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string))
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({ logs: data });
  } catch (error) {
    return handleError(res, error, 'audit-logs');
  }
}

import { supabaseAdmin } from '../_lib/supabase';
