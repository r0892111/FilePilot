/*
  # User Email Accounts Table

  1. New Tables
    - `user_email_accounts`
      - `id` (bigint, primary key)
      - `user_id` (uuid, references auth.users)
      - `email` (text, the email address)
      - `provider` (text, gmail/outlook)
      - `status` (text, active/error/syncing)
      - `connected_at` (timestamp)
      - `last_sync` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_email_accounts` table
    - Add policy for authenticated users to manage their own email accounts
*/

CREATE TABLE IF NOT EXISTS user_email_accounts (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  email text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error', 'syncing')),
  connected_at timestamptz DEFAULT now(),
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email)
);

ALTER TABLE user_email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own email accounts"
  ON user_email_accounts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to add email account
CREATE OR REPLACE FUNCTION add_user_email_account(
  user_uuid uuid,
  email_address text,
  email_provider text
)
RETURNS json AS $$
DECLARE
  new_account user_email_accounts;
BEGIN
  INSERT INTO user_email_accounts (user_id, email, provider)
  VALUES (user_uuid, email_address, email_provider)
  RETURNING * INTO new_account;
  
  RETURN json_build_object(
    'id', new_account.id,
    'email', new_account.email,
    'provider', new_account.provider,
    'status', new_account.status,
    'connected_at', new_account.connected_at
  );
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Email account already exists for this user';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to add email account: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove email account
CREATE OR REPLACE FUNCTION remove_user_email_account(
  user_uuid uuid,
  email_address text
)
RETURNS boolean AS $$
BEGIN
  DELETE FROM user_email_accounts 
  WHERE user_id = user_uuid AND email = email_address;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update email account status
CREATE OR REPLACE FUNCTION update_email_account_status(
  user_uuid uuid,
  email_address text,
  new_status text
)
RETURNS boolean AS $$
BEGIN
  UPDATE user_email_accounts 
  SET status = new_status, 
      last_sync = CASE WHEN new_status = 'active' THEN now() ELSE last_sync END,
      updated_at = now()
  WHERE user_id = user_uuid AND email = email_address;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;