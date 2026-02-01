-- Migration: Update integrations table for persistent connection with Telegram ID
-- Date: 2026-02-01

-- Add new columns to integrations table
ALTER TABLE integrations
ADD COLUMN IF NOT EXISTS telegram_user_id bigint,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'connected',
ADD COLUMN IF NOT EXISTS token_cipher text,
ADD COLUMN IF NOT EXISTS token_iv text,
ADD COLUMN IF NOT EXISTS token_salt text,
ADD COLUMN IF NOT EXISTS token_last4 text,
ADD COLUMN IF NOT EXISTS shop_ids jsonb,
ADD COLUMN IF NOT EXISTS seller_meta jsonb,
ADD COLUMN IF NOT EXISTS connected_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create index on telegram_user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_integrations_telegram_user_id ON integrations(telegram_user_id);

-- Create index on telegram_user_id + provider combination
CREATE INDEX IF NOT EXISTS idx_integrations_telegram_provider ON integrations(telegram_user_id, provider);

-- Add unique constraint to ensure one integration per user per provider
ALTER TABLE integrations
DROP CONSTRAINT IF EXISTS unique_telegram_provider;

ALTER TABLE integrations
ADD CONSTRAINT unique_telegram_provider UNIQUE(telegram_user_id, provider);

-- Add check constraint for status values
ALTER TABLE integrations
DROP CONSTRAINT IF EXISTS check_status_values;

ALTER TABLE integrations
ADD CONSTRAINT check_status_values CHECK (status IN ('connected', 'disconnected', 'error'));

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_integrations_updated_at ON integrations;
CREATE TRIGGER trigger_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_integrations_updated_at();

-- Enable Row Level Security
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can insert their own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can update their own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can delete their own integrations" ON integrations;

-- RLS Policies - Allow access only to user's own integrations
-- Note: Since we don't use Supabase Auth, these policies should be adapted
-- to work with service role or through backend functions

-- For now, create permissive policies that will be restricted via backend
CREATE POLICY "Service role full access" ON integrations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comment with explanation
COMMENT ON TABLE integrations IS 'Stores encrypted integration tokens per user. Access should be restricted via backend functions that verify Telegram initData.';
COMMENT ON COLUMN integrations.telegram_user_id IS 'Telegram user ID from initDataUnsafe.user.id';
COMMENT ON COLUMN integrations.status IS 'Integration status: connected, disconnected, error';
COMMENT ON COLUMN integrations.token_cipher IS 'Encrypted token using AES-256-GCM';
COMMENT ON COLUMN integrations.token_iv IS 'Initialization vector for encryption';
COMMENT ON COLUMN integrations.token_salt IS 'Salt used for PBKDF2 key derivation';
COMMENT ON COLUMN integrations.token_last4 IS 'Last 4 characters of token for display (optional)';
COMMENT ON COLUMN integrations.shop_ids IS 'JSON array of shop IDs from provider';
COMMENT ON COLUMN integrations.seller_meta IS 'JSON metadata about seller/company';
