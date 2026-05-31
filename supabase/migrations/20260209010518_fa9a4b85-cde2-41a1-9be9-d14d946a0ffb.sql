
-- Fix the overly permissive INSERT policy on admin_notifications
-- Drop the existing permissive policy and replace with a proper one
DROP POLICY IF EXISTS "System can insert notifications" ON public.admin_notifications;

-- Only allow inserts from authenticated users (the trigger runs as SECURITY DEFINER anyway)
-- The trigger function bypasses RLS, so no INSERT policy is needed for the trigger
-- But we still need to allow the trigger function to work, so we use a check
CREATE POLICY "Authenticated can insert notifications"
ON public.admin_notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
