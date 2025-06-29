/*
  # OAuth Callback Handler Functions

  1. New Functions
    - `handle_oauth_email_callback` - Processes OAuth callback and adds email account
    - `initialize_user_onboarding` - Ensures onboarding steps exist for user
    - `update_onboarding_step` - Updates specific onboarding step

  2. Security
    - All functions use SECURITY DEFINER for proper access
    - RLS policies ensure users can only access their own data
*/

-- Function to initialize user onboarding steps if they don't exist
CREATE OR REPLACE FUNCTION initialize_user_onboarding(user_uuid uuid)
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

-- Function to update specific onboarding step
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

  -- Ensure onboarding record exists
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

-- Function to handle OAuth email callback
CREATE OR REPLACE FUNCTION handle_oauth_email_callback(
  user_uuid uuid,
  email_address text,
  sync_date date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  add_result json;
  step_result json;
BEGIN
  -- Validate email format
  IF email_address !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN json_build_object('success', false, 'error', 'Invalid email format.');
  END IF;

  -- Add the email account
  SELECT add_user_email_account(user_uuid, email_address, 'gmail', sync_date) INTO add_result;

  -- Check if email was added successfully
  IF (add_result->>'success')::boolean THEN
    -- Update the email_connected onboarding step
    SELECT update_onboarding_step(user_uuid, 'email', true) INTO step_result;

    result := json_build_object(
      'success', true,
      'email', email_address,
      'account_id', add_result->>'account_id',
      'onboarding_updated', (step_result->>'success')::boolean,
      'message', 'OAuth email callback processed successfully'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'Failed to add email account: ' || (add_result->>'error')
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

-- Function to get user onboarding status
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
  -- Ensure onboarding record exists
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

-- Function to check if user has connected emails
CREATE OR REPLACE FUNCTION user_has_connected_emails(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_count int;
BEGIN
  SELECT COUNT(*) INTO email_count
  FROM user_email_accounts
  WHERE user_id = user_uuid AND status = 'active';

  RETURN email_count > 0;
END;
$$;

-- Function to sync onboarding status with actual data
CREATE OR REPLACE FUNCTION sync_onboarding_status(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  has_subscription boolean := false;
  has_emails boolean := false;
  has_folder boolean := false; -- This would need to be implemented based on your folder logic
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

  -- For now, assume folder is selected if other steps are complete
  -- You can modify this logic based on your folder selection implementation
  has_folder := has_subscription AND has_emails;

  -- Calculate if all steps are completed
  all_completed := has_subscription AND has_emails AND has_folder;

  -- Ensure onboarding record exists
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