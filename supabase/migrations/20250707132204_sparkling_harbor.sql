/*
  # Fix User Onboarding Function

  1. Issues Fixed
    - Function signature mismatch in trigger
    - Ensure proper function exists for new user creation
    - Fix any conflicts between different function versions

  2. Functions
    - `initialize_user_onboarding` - Simple version for trigger
    - `handle_new_user` - Trigger function that calls initialization
*/

-- Drop existing trigger and functions to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS initialize_user_onboarding(uuid);

-- Create the simple initialization function for triggers
CREATE OR REPLACE FUNCTION initialize_user_onboarding(user_uuid uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO user_onboarding_steps (user_id)
  VALUES (user_uuid)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Initialize onboarding steps for the new user
  PERFORM initialize_user_onboarding(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Also create the JSON-returning version for API calls
CREATE OR REPLACE FUNCTION initialize_user_onboarding_api(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  existing_record record;
BEGIN
  -- Check if onboarding record already exists
  SELECT * INTO existing_record
  FROM user_onboarding_steps
  WHERE user_id = user_uuid;

  IF NOT FOUND THEN
    -- Create new onboarding record
    INSERT INTO user_onboarding_steps (
      user_id,
      payment_completed,
      email_connected,
      folder_selected,
      onboarding_completed
    ) VALUES (
      user_uuid,
      false,
      false,
      false,
      false
    );

    result := json_build_object(
      'success', true,
      'message', 'Onboarding steps initialized successfully',
      'created', true
    );
  ELSE
    result := json_build_object(
      'success', true,
      'message', 'Onboarding steps already exist',
      'created', false
    );
  END IF;

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to initialize onboarding steps: ' || SQLERRM
    );
END;
$$;

-- Update the other functions to use the correct initialization function
CREATE OR REPLACE FUNCTION update_onboarding_step(
  user_uuid uuid,
  step_name text,
  completed boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  updated_count int;
  all_completed boolean;
BEGIN
  -- Validate step_name
  IF step_name NOT IN ('payment', 'email', 'folder') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid step name. Must be payment, email, or folder.'
    );
  END IF;

  -- Ensure onboarding record exists (use the simple version)
  PERFORM initialize_user_onboarding(user_uuid);

  -- Update the specific step
  IF step_name = 'payment' THEN
    UPDATE user_onboarding_steps
    SET payment_completed = completed, updated_at = now()
    WHERE user_id = user_uuid;
  ELSIF step_name = 'email' THEN
    UPDATE user_onboarding_steps
    SET email_connected = completed, updated_at = now()
    WHERE user_id = user_uuid;
  ELSIF step_name = 'folder' THEN
    UPDATE user_onboarding_steps
    SET folder_selected = completed, updated_at = now()
    WHERE user_id = user_uuid;
  END IF;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Check if all steps are completed
  SELECT (payment_completed AND email_connected AND folder_selected) INTO all_completed
  FROM user_onboarding_steps
  WHERE user_id = user_uuid;

  -- Update onboarding_completed if all steps are done
  IF all_completed THEN
    UPDATE user_onboarding_steps
    SET onboarding_completed = true, updated_at = now()
    WHERE user_id = user_uuid;
  END IF;

  IF updated_count > 0 THEN
    result := json_build_object(
      'success', true,
      'step', step_name,
      'completed', completed,
      'all_completed', all_completed,
      'message', 'Onboarding step updated successfully'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'Failed to update onboarding step'
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

-- Update get_user_onboarding_status to use simple initialization
CREATE OR REPLACE FUNCTION get_user_onboarding_status(user_uuid uuid)
RETURNS TABLE (
  payment_completed boolean,
  email_connected boolean,
  folder_selected boolean,
  onboarding_completed boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure onboarding record exists (use the simple version)
  PERFORM initialize_user_onboarding(user_uuid);

  RETURN QUERY
  SELECT 
    uos.payment_completed,
    uos.email_connected,
    uos.folder_selected,
    uos.onboarding_completed,
    uos.created_at,
    uos.updated_at
  FROM user_onboarding_steps uos
  WHERE uos.user_id = user_uuid;
END;
$$;

-- Update sync_onboarding_status to use simple initialization
CREATE OR REPLACE FUNCTION sync_onboarding_status(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  has_subscription boolean := false;
  has_emails boolean := false;
  has_folder boolean := false;
  all_completed boolean;
BEGIN
  -- Check if user has active subscription
  SELECT EXISTS(
    SELECT 1 FROM stripe_user_subscriptions 
    WHERE customer_id IN (
      SELECT customer_id FROM stripe_customers WHERE user_id = user_uuid
    ) AND subscription_status = 'active'
  ) INTO has_subscription;

  -- Check if user has connected emails
  SELECT user_has_connected_emails(user_uuid) INTO has_emails;

  -- Check if user has selected a folder
  SELECT EXISTS(
    SELECT 1 FROM user_drive_account WHERE user_id = user_uuid AND drive_folderId IS NOT NULL
  ) INTO has_folder;

  -- Calculate if all steps are completed
  all_completed := has_subscription AND has_emails AND has_folder;

  -- Ensure onboarding record exists (use the simple version)
  PERFORM initialize_user_onboarding(user_uuid);

  -- Update onboarding steps based on actual data
  UPDATE user_onboarding_steps
  SET 
    payment_completed = has_subscription,
    email_connected = has_emails,
    folder_selected = has_folder,
    onboarding_completed = all_completed,
    updated_at = now()
  WHERE user_id = user_uuid;

  result := json_build_object(
    'success', true,
    'payment_completed', has_subscription,
    'email_connected', has_emails,
    'folder_selected', has_folder,
    'onboarding_completed', all_completed,
    'message', 'Onboarding status synced successfully'
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'An unexpected error occurred: ' || SQLERRM
    );
END;
$$;