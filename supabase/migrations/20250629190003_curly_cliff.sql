/*
  # User Email Accounts Management

  1. New Tables
    - `user_email_accounts`
      - `id` (bigint, primary key)
      - `user_id` (uuid, references auth.users)
      - `email` (text, unique per user)
      - `provider` (text, gmail/outlook)
      - `status` (text, active/error/syncing)
      - `connected_at` (timestamptz)
      - `last_sync` (timestamptz)
      - `email_history` (date, sync range)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_email_accounts` table
    - Add policy for authenticated users to manage their own accounts

  3. Functions
    - `add_user_email_account` - Add new email account
    - `remove_user_email_account` - Remove email account
    - `update_email_account_status` - Update account status
    - `get_user_email_accounts` - Get all user email accounts
    - `update_email_sync_range` - Update sync date range
    - `get_user_email_account_by_email` - Get specific email account

  4. Performance
    - Indexes for user_id, email, status, provider
    - Auto-update trigger for updated_at column
*/

-- Drop existing functions if they exist to avoid return type conflicts
DROP FUNCTION IF EXISTS add_user_email_account(uuid, text, text, date);
DROP FUNCTION IF EXISTS remove_user_email_account(uuid, text);
DROP FUNCTION IF EXISTS update_email_account_status(uuid, text, text);
DROP FUNCTION IF EXISTS get_user_email_accounts(uuid);
DROP FUNCTION IF EXISTS update_email_sync_range(uuid, text, date);
DROP FUNCTION IF EXISTS get_user_email_account_by_email(uuid, text);

-- Create user_email_accounts table
CREATE TABLE IF NOT EXISTS user_email_accounts (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL,
  email text NOT NULL,
  provider text NOT NULL DEFAULT 'gmail' CHECK (provider IN ('gmail', 'outlook')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error', 'syncing')),
  connected_at timestamptz DEFAULT now(),
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  email_history date,
  UNIQUE(user_id, email)
);

-- Add foreign key constraint to auth.users if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    -- Check if constraint doesn't already exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'user_email_accounts_user_id_fkey' 
      AND table_name = 'user_email_accounts'
    ) THEN
      ALTER TABLE user_email_accounts 
      ADD CONSTRAINT user_email_accounts_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE user_email_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own email accounts" ON user_email_accounts;

-- Create policy for users to manage their own email accounts
CREATE POLICY "Users can manage their own email accounts"
  ON user_email_accounts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to add user email account
CREATE FUNCTION add_user_email_account(
  user_uuid uuid,
  email_address text,
  email_provider text DEFAULT 'gmail',
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
    RETURN json_build_object('success', false, 'error', 'Invalid email provider. Must be gmail or outlook.');
  END IF;

  -- Validate email format
  IF email_address !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN json_build_object('success', false, 'error', 'Invalid email format.');
  END IF;

  -- Insert the email account
  INSERT INTO user_email_accounts (
    user_id,
    email,
    provider,
    email_history,
    status,
    connected_at
  ) VALUES (
    user_uuid,
    email_address,
    email_provider,
    sync_date,
    'active',
    now()
  )
  RETURNING id INTO account_id;

  -- Return success response
  result := json_build_object(
    'success', true,
    'account_id', account_id,
    'email', email_address,
    'provider', email_provider,
    'message', 'Email account added successfully'
  );

  RETURN result;

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'This email account is already connected to your account.'
    );
  WHEN foreign_key_violation THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Invalid user ID provided.'
    );
  WHEN check_violation THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Invalid provider or status value.'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'An unexpected error occurred: ' || SQLERRM
    );
END;
$$;

-- Function to remove user email account
CREATE FUNCTION remove_user_email_account(
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
  account_record record;
BEGIN
  -- Check if account exists and belongs to user
  SELECT id, email, provider INTO account_record
  FROM user_email_accounts
  WHERE user_id = user_uuid AND email = email_address;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email account not found or does not belong to this user.'
    );
  END IF;

  -- Delete the email account
  DELETE FROM user_email_accounts
  WHERE user_id = user_uuid AND email = email_address;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count > 0 THEN
    result := json_build_object(
      'success', true,
      'email', email_address,
      'message', 'Email account removed successfully'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'Failed to remove email account'
    );
  END IF;

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'An unexpected error occurred: ' || SQLERRM
    );
END;
$$;

-- Function to update email account status
CREATE FUNCTION update_email_account_status(
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
  old_status text;
BEGIN
  -- Validate status
  IF new_status NOT IN ('active', 'error', 'syncing') THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Invalid status. Must be active, error, or syncing.'
    );
  END IF;

  -- Get current status
  SELECT status INTO old_status
  FROM user_email_accounts
  WHERE user_id = user_uuid AND email = email_address;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email account not found or does not belong to this user.'
    );
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
      'email', email_address,
      'old_status', old_status,
      'new_status', new_status,
      'message', 'Email account status updated successfully'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'Failed to update email account status'
    );
  END IF;

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'An unexpected error occurred: ' || SQLERRM
    );
END;
$$;

-- Function to get user email accounts
CREATE FUNCTION get_user_email_accounts(user_uuid uuid)
RETURNS TABLE (
  id bigint,
  email text,
  provider text,
  status text,
  connected_at timestamptz,
  last_sync timestamptz,
  email_history date,
  created_at timestamptz,
  updated_at timestamptz
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
    uea.created_at,
    uea.updated_at
  FROM user_email_accounts uea
  WHERE uea.user_id = user_uuid
  ORDER BY uea.created_at DESC;
END;
$$;

-- Function to update email sync date range
CREATE FUNCTION update_email_sync_range(
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
  old_date date;
BEGIN
  -- Validate sync_date is not in the future
  IF sync_date > CURRENT_DATE THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Sync date cannot be in the future.'
    );
  END IF;

  -- Get current sync date
  SELECT email_history INTO old_date
  FROM user_email_accounts
  WHERE user_id = user_uuid AND email = email_address;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email account not found or does not belong to this user.'
    );
  END IF;

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
      'email', email_address,
      'old_sync_date', old_date,
      'new_sync_date', sync_date,
      'message', 'Email sync range updated successfully'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'Failed to update email sync range'
    );
  END IF;

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'An unexpected error occurred: ' || SQLERRM
    );
END;
$$;

-- Function to get email account by email address
CREATE FUNCTION get_user_email_account_by_email(
  user_uuid uuid,
  email_address text
)
RETURNS TABLE (
  id bigint,
  email text,
  provider text,
  status text,
  connected_at timestamptz,
  last_sync timestamptz,
  email_history date,
  created_at timestamptz,
  updated_at timestamptz
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
    uea.created_at,
    uea.updated_at
  FROM user_email_accounts uea
  WHERE uea.user_id = user_uuid AND uea.email = email_address;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_email_accounts_user_id ON user_email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_email_accounts_email ON user_email_accounts(email);
CREATE INDEX IF NOT EXISTS idx_user_email_accounts_status ON user_email_accounts(status);
CREATE INDEX IF NOT EXISTS idx_user_email_accounts_provider ON user_email_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_user_email_accounts_user_email ON user_email_accounts(user_id, email);

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_user_email_accounts_updated_at ON user_email_accounts;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create trigger function to automatically update updated_at timestamp
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_user_email_accounts_updated_at
  BEFORE UPDATE ON user_email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();