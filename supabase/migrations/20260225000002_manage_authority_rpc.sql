-- Migration to replace manage-authority Edge Function with native Postgres RPC
-- This entirely avoids the "Failed to send a request" error caused by complex Deno bundling/CORS.

-- 1. Ensure pgcrypto is enabled (on by default in Supabase, but good to be safe)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Drop the old function explicitly so we can safely rename parameter arguments (e.g. email -> p_email)
DROP FUNCTION IF EXISTS public.manage_authority_rpc(text,text,text,text,text,uuid,boolean);

-- 3. Create the RPC function
CREATE OR REPLACE FUNCTION public.manage_authority_rpc(
  p_action TEXT,
  p_email TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL,
  p_display_name TEXT DEFAULT NULL,
  p_role_title TEXT DEFAULT NULL,
  p_authority_user_id UUID DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_caller_role TEXT;
  v_new_user_id UUID;
  v_encrypted_pw TEXT;
BEGIN
  -- Verify caller is admin
  SELECT role INTO v_caller_role FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin';
  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_action = 'create' THEN
    IF p_email IS NULL OR p_password IS NULL OR p_display_name IS NULL OR p_role_title IS NULL THEN
      RAISE EXCEPTION 'Missing required fields for create';
    END IF;

    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
      RETURN jsonb_build_object('error', 'A user with this email already exists.');
    END IF;

    -- Generate a new UUID for the user
    v_new_user_id := gen_random_uuid();
    v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

    -- Insert into auth.users (simulate auth.admin.createUser)
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_current, email_change_token_new, email_change, reauthentication_token, phone_change_token, phone_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_new_user_id, 'authenticated', 'authenticated', p_email, v_encrypted_pw, now(), '{"provider":"email","providers":["email"]}', json_build_object('full_name', p_display_name), now(), now(),
      '', '', '', '', '', '', '', ''
    );

    -- Insert into auth.identities
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_new_user_id, json_build_object('sub', v_new_user_id, 'email', p_email), 'email', p_email, now(), now(), now()
    );

    -- Safely Set role to authority in user_roles without ON CONFLICT
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_new_user_id) THEN
      UPDATE public.user_roles SET role = 'authority' WHERE user_id = v_new_user_id;
    ELSE
      INSERT INTO public.user_roles (user_id, role) VALUES (v_new_user_id, 'authority');
    END IF;

    -- Create authority profile
    INSERT INTO public.authority_profiles (user_id, display_name, role_title)
    VALUES (v_new_user_id, p_display_name, p_role_title);

    RETURN jsonb_build_object('message', 'Authority created', 'user_id', v_new_user_id);

  ELSIF p_action = 'update' THEN
    IF p_authority_user_id IS NULL THEN
      RAISE EXCEPTION 'Missing authority_user_id for update';
    END IF;

    IF p_display_name IS NOT NULL THEN
      UPDATE public.authority_profiles SET display_name = p_display_name, updated_at = now() WHERE user_id = p_authority_user_id;
    END IF;
    IF p_role_title IS NOT NULL THEN
      UPDATE public.authority_profiles SET role_title = p_role_title, updated_at = now() WHERE user_id = p_authority_user_id;
    END IF;
    IF p_is_active IS NOT NULL THEN
      UPDATE public.authority_profiles SET is_active = p_is_active, updated_at = now() WHERE user_id = p_authority_user_id;
    END IF;

    RETURN jsonb_build_object('message', 'Authority updated');

  ELSIF p_action = 'delete' THEN
    IF p_authority_user_id IS NULL THEN
      RAISE EXCEPTION 'Missing authority_user_id for delete';
    END IF;

    -- Delete from auth.users (cascades to profiles and roles)
    DELETE FROM auth.users WHERE id = p_authority_user_id;

    RETURN jsonb_build_object('message', 'Authority deleted');

  ELSE
    RAISE EXCEPTION 'Unknown action';
  END IF;
END;
$$;
