/**
 * Integration Persistence Layer
 * Manages persistent storage of integrations tied to Telegram user ID
 */

import { supabase } from '../supabase';

export interface IntegrationData {
  id: string;
  telegram_user_id: number;
  provider: string;
  connected_at: string;
  updated_at: string;
  metadata?: any;
  status?: 'connected' | 'disconnected';
}

/**
 * Get Telegram user ID from WebApp
 */
export function getTelegramUserId(): number | null {
  try {
    const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    return tgUserId || null;
  } catch (e) {
    console.error('[Integration] Failed to get Telegram user ID:', e);
    return null;
  }
}

/**
 * Check if integration exists and is connected for current Telegram user
 */
export async function checkIntegrationStatus(
  provider: string = 'uzum'
): Promise<{
  connected: boolean;
  integration?: IntegrationData;
  error?: string;
}> {
  const tgUserId = getTelegramUserId();
  
  if (!tgUserId) {
    return { connected: false, error: 'Telegram user ID not available' };
  }

  try {
    const { data, error } = await supabase
      .from('integrations')
      .select('id, telegram_user_id, provider, created_at, updated_at, metadata')
      .eq('telegram_user_id', tgUserId)
      .eq('provider', provider)
      .maybeSingle();

    if (error) {
      console.error('[Integration] Check status error:', error);
      return { connected: false, error: error.message };
    }

    if (!data) {
      return { connected: false };
    }

    return {
      connected: true,
      integration: {
        id: data.id,
        telegram_user_id: data.telegram_user_id,
        provider: data.provider,
        connected_at: data.created_at,
        updated_at: data.updated_at,
        metadata: data.metadata,
        status: 'connected',
      },
    };
  } catch (e: any) {
    console.error('[Integration] Check status exception:', e);
    return { connected: false, error: e.message };
  }
}

/**
 * Load integration data and decrypt token with PIN from DB
 */
export async function loadIntegrationWithSession(
  provider: string = 'uzum'
): Promise<{
  success: boolean;
  decryptedToken?: string;
  shops?: any[];
  sellerInfo?: any;
  integrationId?: string;
  error?: string;
}> {
  const tgUserId = getTelegramUserId();
  
  if (!tgUserId) {
    return { success: false, error: 'Telegram user ID not available' };
  }

  try {
    // Get integration from DB
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('telegram_user_id', tgUserId)
      .eq('provider', provider)
      .maybeSingle();

    if (error) {
      console.error('[Integration] Load error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Integration not found' };
    }

    // Try to decrypt PIN from DB first
    let pin: string | null = null;
    
    if (data.encrypted_pin_cipher && data.encrypted_pin_iv && data.encrypted_pin_salt) {
      try {
        const { decryptPIN } = await import('./crypto');
        pin = await decryptPIN(
          data.encrypted_pin_cipher,
          data.encrypted_pin_iv,
          data.encrypted_pin_salt
        );
        console.log('[Integration] ✓ PIN decrypted from DB');
      } catch (pinError) {
        console.error('[Integration] Failed to decrypt PIN from DB:', pinError);
      }
    }

    // Fallback to session PIN if DB PIN not available
    if (!pin) {
      pin = sessionStorage.getItem(`${provider}_pin_temp`);
    }
    
    if (!pin || !data.token_cipher || !data.token_iv || !data.token_salt) {
      return {
        success: true,
        integrationId: data.id,
        shops: data.metadata?.shops || [],
        sellerInfo: data.metadata?.sellerInfo || null,
        error: 'PIN required for decryption',
      };
    }

    try {
      const { decryptToken } = await import('./crypto');
      const decrypted = await decryptToken(
        data.token_cipher,
        data.token_iv,
        data.token_salt,
        pin
      );

      if (!decrypted) {
        return {
          success: true,
          integrationId: data.id,
          shops: data.metadata?.shops || [],
          sellerInfo: data.metadata?.sellerInfo || null,
          error: 'Invalid PIN',
        };
      }

      return {
        success: true,
        decryptedToken: decrypted,
        shops: data.metadata?.shops || [],
        sellerInfo: data.metadata?.sellerInfo || null,
        integrationId: data.id,
      };
    } catch (decryptError: any) {
      console.error('[Integration] Decryption error:', decryptError);
      return {
        success: true,
        integrationId: data.id,
        shops: data.metadata?.shops || [],
        sellerInfo: data.metadata?.sellerInfo || null,
        error: 'Decryption failed',
      };
    }
  } catch (e: any) {
    console.error('[Integration] Load exception:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Persist PIN in sessionStorage for automatic decryption
 * Note: This is cleared when tab is closed, requiring re-authentication
 */
export function persistPINInSession(provider: string, pin: string): void {
  try {
    sessionStorage.setItem(`${provider}_pin_temp`, pin);
    console.log(`[Integration] PIN persisted in session for ${provider}`);
  } catch (e) {
    console.error('[Integration] Failed to persist PIN:', e);
  }
}

/**
 * Clear PIN from sessionStorage
 */
export function clearPINFromSession(provider: string): void {
  try {
    sessionStorage.removeItem(`${provider}_pin_temp`);
    console.log(`[Integration] PIN cleared from session for ${provider}`);
  } catch (e) {
    console.error('[Integration] Failed to clear PIN:', e);
  }
}

/**
 * Disconnect integration (soft delete - keeps record but clears sensitive data)
 */
export async function disconnectIntegration(
  provider: string = 'uzum'
): Promise<{
  success: boolean;
  error?: string;
}> {
  const tgUserId = getTelegramUserId();
  
  if (!tgUserId) {
    return { success: false, error: 'Telegram user ID not available' };
  }

  try {
    // Delete integration from database
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('telegram_user_id', tgUserId)
      .eq('provider', provider);

    if (error) {
      console.error('[Integration] Disconnect error:', error);
      return { success: false, error: error.message };
    }

    // Clear session PIN
    clearPINFromSession(provider);

    console.log(`[Integration] ✓ Disconnected ${provider} for user ${tgUserId}`);
    return { success: true };
  } catch (e: any) {
    console.error('[Integration] Disconnect exception:', e);
    return { success: false, error: e.message };
  }
}
