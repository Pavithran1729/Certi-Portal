import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CertificateWithStudent {
  id: string;
  certificate_type: string;
  status: string;
  application_date: string;
  issue_date: string | null;
  admin_remarks: string | null;
  form_data: any;
  generated_certificate_url: string | null;
  created_at: string;
  updated_at: string;
  student_id: string;
  profiles: {
    full_name: string | null;
    roll_number: string | null;
    branch: string | null;
    year: string | null;
    email: string | null;
    degree: string | null;
    section: string | null;
    phone: string | null;
  } | null;
  certificate_approvals?: {
    id: string;
    status: string;
    authority_user_id: string;
    approval_order: number;
  }[];
}

const CERT_TYPE_LABELS: Record<string, string> = {
  tc: "Transfer Certificate",
  bonafide: "Bonafide Certificate",
  attendance: "Attendance Certificate",
  conduct: "Conduct Certificate",
  training: "Training Certificate",
};

export function getCertificateTypeLabel(type: string): string {
  return CERT_TYPE_LABELS[type] || type;
}

export function useAdminCertificates() {
  return useQuery({
    queryKey: ["admin-certificates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select(`
          *,
          profiles (
            full_name,
            roll_number,
            branch,
            year,
            email,
            degree,
            section,
            phone
          ),
          certificate_approvals (
            id,
            status,
            authority_user_id,
            approval_order
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as CertificateWithStudent[];
    },
  });
}

// Admin: get stats
export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data: certs, error } = await supabase
        .from("certificates")
        .select("status");

      if (error) throw error;

      const { count: studentCount, error: sErr } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });

      if (sErr) throw sErr;

      let authorityCount = 0;
      try {
        const { count, error: aErr } = await supabase
          .from("authority_profiles")
          .select("id", { count: "exact", head: true });
        if (!aErr) authorityCount = count ?? 0;
      } catch {
        // ignore
      }

      const total = certs?.length ?? 0;
      const pending = certs?.filter((c) => c.status === "pending").length ?? 0;
      const approved = certs?.filter((c) => c.status === "approved").length ?? 0;
      const rejected = certs?.filter((c) => c.status === "rejected").length ?? 0;

      return { total, pending, approved, rejected, students: studentCount ?? 0, authorities: authorityCount };
    },
  });
}

// Admin: update certificate status
export function useUpdateCertificateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      certificateId,
      status,
      remarks,
    }: {
      certificateId: string;
      status: string;
      remarks?: string;
    }) => {
      const updateData: Record<string, any> = { status };
      if (remarks !== undefined) updateData.admin_remarks = remarks;
      if (status === "approved") updateData.issue_date = new Date().toISOString();

      const { data, error } = await supabase
        .from("certificates")
        .update(updateData)
        .eq("id", certificateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-certificates"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["student-certificates"] });
    },
  });
}

// Student: fetch own certificates
export function useStudentCertificates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["student-certificates", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) return [];

      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("student_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
