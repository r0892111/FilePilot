/*
  # Add user categories table

  1. New Tables
    - `user_catergories` (note: keeping existing typo for compatibility)
      - `id` (uuid, primary key, references auth.users)
      - `created_at` (timestamp)
      - `categories` (json, stores user's document categories)

  2. Security
    - Enable RLS on `user_catergories` table
    - Add policy for authenticated users to manage their own categories

  3. Functions
    - Function to get user categories count
    - Function to update user categories
*/

-- Create user categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_catergories (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  categories json
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_catergories_id_fkey' 
    AND table_name = 'user_catergories'
  ) THEN
    ALTER TABLE user_catergories 
    ADD CONSTRAINT user_catergories_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE user_catergories ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own categories" ON user_catergories;

-- Create policy for users to manage their own categories
CREATE POLICY "Users can manage their own categories"
  ON user_catergories
  FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Function to get user categories count
CREATE OR REPLACE FUNCTION get_user_categories_count(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  category_count integer := 0;
  categories_data json;
BEGIN
  SELECT categories INTO categories_data
  FROM user_catergories
  WHERE id = user_uuid;

  IF categories_data IS NOT NULL THEN
    -- Count the number of categories in the JSON array
    SELECT json_array_length(categories_data) INTO category_count;
  END IF;

  RETURN COALESCE(category_count, 0);
END;
$$;

-- Function to update user categories
CREATE OR REPLACE FUNCTION update_user_categories(
  user_uuid uuid,
  new_categories json
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Insert or update user categories
  INSERT INTO user_catergories (id, categories)
  VALUES (user_uuid, new_categories)
  ON CONFLICT (id) 
  DO UPDATE SET 
    categories = new_categories,
    created_at = now();

  result := json_build_object(
    'success', true,
    'categories_count', json_array_length(new_categories),
    'message', 'Categories updated successfully'
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to update categories: ' || SQLERRM
    );
END;
$$;