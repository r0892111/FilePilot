/*
  # Add user drive account table

  1. New Tables
    - `user_drive_account`
      - `id` (bigint, primary key)
      - `created_at` (timestamp)
      - `drive_folderId` (text, Google Drive folder ID)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `user_drive_account` table
    - Add policy for authenticated users to manage their own drive accounts

  3. Functions
    - Function to get user drive folder
    - Function to update user drive folder
*/

-- Create user drive account table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_drive_account (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz NOT NULL DEFAULT now(),
  drive_folderId text,
  user_id uuid
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_drive_account_user_id_fkey' 
    AND table_name = 'user_drive_account'
  ) THEN
    ALTER TABLE user_drive_account 
    ADD CONSTRAINT user_drive_account_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE user_drive_account ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own drive accounts" ON user_drive_account;

-- Create policy for users to manage their own drive accounts
CREATE POLICY "Users can manage their own drive accounts"
  ON user_drive_account
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to get user drive folder
CREATE OR REPLACE FUNCTION get_user_drive_folder(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  folder_id text;
BEGIN
  SELECT drive_folderId INTO folder_id
  FROM user_drive_account
  WHERE user_id = user_uuid
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN folder_id;
END;
$$;

-- Function to update user drive folder
CREATE OR REPLACE FUNCTION update_user_drive_folder(
  user_uuid uuid,
  folder_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  existing_id bigint;
BEGIN
  -- Check if user already has a drive account
  SELECT id INTO existing_id
  FROM user_drive_account
  WHERE user_id = user_uuid
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    -- Update existing record
    UPDATE user_drive_account
    SET drive_folderId = folder_id,
        created_at = now()
    WHERE id = existing_id;
  ELSE
    -- Insert new record
    INSERT INTO user_drive_account (user_id, drive_folderId)
    VALUES (user_uuid, folder_id);
  END IF;

  result := json_build_object(
    'success', true,
    'folder_id', folder_id,
    'message', 'Drive folder updated successfully'
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to update drive folder: ' || SQLERRM
    );
END;
$$;