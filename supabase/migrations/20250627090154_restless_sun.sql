/*
  # User Onboarding Steps Tracking

  1. New Tables
    - `user_onboarding_steps`
      - `id` (bigint, primary key)
      - `user_id` (uuid, references auth.users)
      - `payment_completed` (boolean, default false)
      - `email_connected` (boolean, default false)
      - `folder_selected` (boolean, default false)
      - `onboarding_completed` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_onboarding_steps` table
    - Add policy for authenticated users to manage their own onboarding data

  3. Functions
    - Function to initialize onboarding steps for new users
    - Function to update specific onboarding steps
*/

CREATE TABLE IF NOT EXISTS user_onboarding_steps (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  payment_completed boolean DEFAULT false,
  email_connected boolean DEFAULT false,
  folder_selected boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_onboarding_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own onboarding steps"
  ON user_onboarding_steps
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to initialize onboarding steps for a user
CREATE OR REPLACE FUNCTION initialize_user_onboarding(user_uuid uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO user_onboarding_steps (user_id)
  VALUES (user_uuid)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update onboarding step
CREATE OR REPLACE FUNCTION update_onboarding_step(
  user_uuid uuid,
  step_name text,
  completed boolean
)
RETURNS void AS $$
BEGIN
  -- Initialize if doesn't exist
  PERFORM initialize_user_onboarding(user_uuid);
  
  -- Update the specific step
  CASE step_name
    WHEN 'payment' THEN
      UPDATE user_onboarding_steps 
      SET payment_completed = completed, updated_at = now()
      WHERE user_id = user_uuid;
    WHEN 'email' THEN
      UPDATE user_onboarding_steps 
      SET email_connected = completed, updated_at = now()
      WHERE user_id = user_uuid;
    WHEN 'folder' THEN
      UPDATE user_onboarding_steps 
      SET folder_selected = completed, updated_at = now()
      WHERE user_id = user_uuid;
    WHEN 'complete' THEN
      UPDATE user_onboarding_steps 
      SET onboarding_completed = completed, updated_at = now()
      WHERE user_id = user_uuid;
  END CASE;
  
  -- Check if all steps are completed and mark onboarding as complete
  UPDATE user_onboarding_steps 
  SET onboarding_completed = (
    payment_completed AND email_connected AND folder_selected
  ), updated_at = now()
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically initialize onboarding steps when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  PERFORM initialize_user_onboarding(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;