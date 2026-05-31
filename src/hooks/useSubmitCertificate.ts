import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function useSubmitCertificate() {
  const navigate = useNavigate();

  const submit = async (
    certificateType: string,
    formData: Record<string, any>,
    onSuccess?: (id: string) => void
  ) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Not authenticated");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (profileError) {
      toast.error("Failed to fetch student record");
      return;
    }

    if (!profile) {
      toast.error("Please complete your profile before applying", {
        action: {
          label: "Go to Profile",
          onClick: () => navigate("/student/profile"),
        },
      });
      return;
    }

    const { data: certData, error: certError } = await supabase
      .from("certificates")
      .insert({
        student_id: profile.id,
        certificate_type: certificateType as any,
        form_data: formData,
      })
      .select()
      .single();

    if (certError || !certData) {
      toast.error("Failed to create certificate request");
      return;
    }

    // Approval steps are created automatically by the database trigger
    // (create_approval_steps_on_cert_submit). No need to create them client-side.

    // Send notifications to all authorities in the approval chain
    await sendApprovalNotifications(certData.id, certificateType);

    onSuccess?.(certData.id);
  };

  return { submit };
}

async function sendApprovalNotifications(certificateId: string, certificateType: string) {
  try {
    // Get all approval steps for this certificate (created by trigger)
    const { data: approvals } = await supabase
      .from("certificate_approvals")
      .select("authority_user_id, approval_order")
      .eq("certificate_id", certificateId);

    if (!approvals || approvals.length === 0) return;

    // Send notification to each authority
    const notifications = approvals.map((approval) => ({
      admin_user_id: approval.authority_user_id,
      certificate_id: certificateId,
      message: `New ${certificateType} certificate request requires your approval (Step #${approval.approval_order})`,
      is_read: false,
    }));

    await supabase
      .from("admin_notifications")
      .insert(notifications);
  } catch (err) {
    console.error("Error sending notifications:", err);
  }
}
