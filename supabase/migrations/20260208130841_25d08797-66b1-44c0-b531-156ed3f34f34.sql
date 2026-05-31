-- Create trigger function to handle new user registration
-- This automatically creates user_roles and students records on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_student_id TEXT;
BEGIN
  -- Generate student ID using existing function
  SELECT public.generate_student_id() INTO new_student_id;
  
  -- Insert user role (student by default)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  -- Insert student record from signup metadata
  INSERT INTO public.students (
    user_id,
    student_id,
    first_name,
    middle_name,
    last_name,
    email,
    phone,
    aadhar_no
  )
  VALUES (
    NEW.id,
    new_student_id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'middle_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'aadhar_number', '')
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();