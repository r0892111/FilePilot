/*
  # User Email Accounts Management

  1. New Tables
    - `user_email_accounts`
      - `id` (bigint, primary key)
      - `user_id` (uuid, foreign key to users)
      - `email` (text, email address)
      - `provider` (text, email provider - gmail/outlook)
      - `status` (text, connection status)
      - `connected_at` (timestamptz, when connected)
      - `last_sync` (timestamptz, last synchronization)
      - `email_history` (date, how far back to sync)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_email_accounts` table
    - Add policy for users to manage their own email accounts

  3. Functions
    - `add_user_email_account` - Add new email account
    - `remove_user_email_account` - Remove email account
    - `update_email_account_status` - Update account status
    - `get_user_email_accounts` - Get user's email accounts
*/

-- Create user_email_accounts table
CREATE TABLE IF NOT EXISTS user_email_accounts (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES users(id),
  email text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error', 'syncing')),
  connected_at timestamptz DEFAULT now(),
  last_sync timestamptz,
  email_history date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Enable RLS
ALTER TABLE user_email_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own email accounts
CREATE POLICY "Users can manage their own email accounts"
  ON user_email_accounts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to add user email account
CREATE OR REPLACE FUNCTION add_user_email_account(
  user_uuid uuid,
  email_address text,
  email_provider text,
  sync_date date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  account_id bigint;
BEGIN
  -- Validate provider
  IF email_provider NOT IN ('gmail', 'outlook') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid email provider');
  END IF;

  -- Insert the email account
  INSERT INTO user_email_accounts (
    user_id,
    email,
    provider,
    email_history,
    status
  ) VALUES (
    user_uuid,
    email_address,
    email_provider,
    sync_date,
    'active'
  )
  RETURNING id INTO account_id;

  -- Return success response
  result := json_build_object(
    'success', true,
    'account_id', account_id,
    'message', 'Email account added successfully'
  );

  RETURN result;

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'Email account already exists');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to remove user email account
CREATE OR REPLACE FUNCTION remove_user_email_account(
  user_uuid uuid,
  email_address text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  deleted_count int;
BEGIN
  -- Delete the email account
  DELETE FROM user_email_accounts
  WHERE user_id = user_uuid AND email = email_address;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count > 0 THEN
    result := json_build_object(
      'success', true,
      'message', 'Email account removed successfully'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'Email account not found'
    );
  END IF;

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to update email account status
CREATE OR REPLACE FUNCTION update_email_account_status(
  user_uuid uuid,
  email_address text,
  new_status text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  updated_count int;
BEGIN
  -- Validate status
  IF new_status NOT IN ('active', 'error', 'syncing') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid status');
  END IF;

  -- Update the email account status
  UPDATE user_email_accounts
  SET 
    status = new_status,
    last_sync = CASE WHEN new_status = 'active' THEN now() ELSE last_sync END,
    updated_at = now()
  WHERE user_id = user_uuid AND email = email_address;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count > 0 THEN
    result := json_build_object(
      'success', true,
      'message', 'Email account status updated successfully'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'Email account not found'
    );
  END IF;

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to get user email accounts
CREATE OR REPLACE FUNCTION get_user_email_accounts(user_uuid uuid)
RETURNS TABLE (
  id bigint,
  email text,
  provider text,
  status text,
  connected_at timestamptz,
  last_sync timestamptz,
  email_history date,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uea.id,
    uea.email,
    uea.provider,
    uea.status,
    uea.connected_at,
    uea.last_sync,
    uea.email_history,
    uea.created_at
  FROM user_email_accounts uea
  WHERE uea.user_id = user_uuid
  ORDER BY uea.created_at DESC;
END;
$$;

-- Function to update email sync date range
CREATE OR REPLACE FUNCTION update_email_sync_range(
  user_uuid uuid,
  email_address text,
  sync_date date
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  updated_count int;
BEGIN
  -- Update the email sync date range
  UPDATE user_email_accounts
  SET 
    email_history = sync_date,
    updated_at = now()
  WHERE user_id = user_uuid AND email = email_address;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count > 0 THEN
    result := json_build_object(
      'success', true,
      'message', 'Email sync range updated successfully'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'Email account not found'
    );
  END IF;

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_email_accounts_user_id ON user_email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_email_accounts_email ON user_email_accounts(email);
CREATE INDEX IF NOT EXISTS idx_user_email_accounts_status ON user_email_accounts(status);