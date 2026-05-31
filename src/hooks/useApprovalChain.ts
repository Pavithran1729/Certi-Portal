import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ApprovalChainItem {
  id: string;
  template_id: string;
  authority_user_id: string;
  approval_order: number;
  is_department_role: boolean;
  created_at: string;
}

export interface CertificateApproval {
  id: string;
  certificate_id: string;
  authority_user_id: string;
  approval_order: number;
  status: string;
  remarks: string | null;
  acted_at: string | null;
  created_at: string;
}

export function useTemplateApprovalChain(templateId: string | undefined) {
  return useQuery({
    queryKey: ["template-approval-chain", templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const { data, error } = await supabase
        .from("template_approval_chain")
        .select("*")
        .eq("template_id", templateId)
        .order("approval_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ApprovalChainItem[];
    },
    enabled: !!templateId,
  });
}

export function useSaveApprovalChain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      chain,
    }: {
      templateId: string;
      chain: { authority_user_id: string; approval_order: number; is_department_role?: boolean }[];
    }) => {
      // Delete existing chain
      await supabase
        .from("template_approval_chain")
        .delete()
        .eq("template_id", templateId);

      if (chain.length > 0) {
        const rows = chain.map((item) => ({
          template_id: templateId,
          authority_user_id: item.authority_user_id,
          approval_order: item.approval_order,
          is_department_role: item.is_department_role ?? false,
        }));

        const { error } = await supabase
          .from("template_approval_chain")
          .insert(rows);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-approval-chain"] });
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
    },
  });
}

export function useCertificateApprovals(certificateId: string | undefined) {
  return useQuery({
    queryKey: ["certificate-approvals", certificateId],
    queryFn: async () => {
      if (!certificateId) return [];
      const { data, error } = await supabase
        .from("certificate_approvals")
        .select("*")
        .eq("certificate_id", certificateId)
        .order("approval_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as CertificateApproval[];
    },
    enabled: !!certificateId,
  });
}

export function useAuthorityPendingApprovals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["authority-pending-approvals", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("certificate_approvals")
        .select(`
          *,
          certificates!inner (
            id,
            certificate_type,
            status,
            application_date,
            form_data,
            student_id,
            profiles!inner (
              full_name,
              roll_number,
              branch,
              year,
              email,
              degree,
              section
            )
          )
        `)
        .eq("authority_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        // Fallback: fetch without nested joins if the above fails
        const { data: approvals, error: err2 } = await supabase
          .from("certificate_approvals")
          .select("*")
          .eq("authority_user_id", user.id)
          .order("created_at", { ascending: false });

        if (err2) throw err2;
        return (approvals ?? []) as unknown as any[];
      }
      return (data ?? []) as unknown as any[];
    },
    enabled: !!user,
  });
}

export function useApproveRejectCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      certificateId,
      action,
      remarks,
    }: {
      certificateId: string;
      action: "approve" | "reject";
      remarks?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("approve-certificate", {
        body: { certificateId, action, remarks },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authority-pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["certificate-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-certificates"] });
      queryClient.invalidateQueries({ queryKey: ["student-certificates"] });
    },
  });
}
