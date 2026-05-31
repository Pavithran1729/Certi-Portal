
-- Bug 7: Add RLS policies for authority role on admin_notifications
CREATE POLICY "Authorities can view own notifications"
ON public.admin_notifications FOR SELECT
TO authenticated
USING (auth.uid() = admin_user_id AND public.has_role(auth.uid(), 'authority'::app_role));

CREATE POLICY "Authorities can update own notifications"
ON public.admin_notifications FOR UPDATE
TO authenticated
USING (auth.uid() = admin_user_id AND public.has_role(auth.uid(), 'authority'::app_role));
