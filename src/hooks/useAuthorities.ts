import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuthorityProfile {
  id: string;
  user_id: string;
  display_name: string;
  role_title: string;
  is_active: boolean;
  department: string | null;
  created_at: string;
  updated_at: string;
}

export function useAuthorities() {
  return useQuery({
    queryKey: ["authorities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("authority_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as AuthorityProfile[];
    },
  });
}

export function useCreateAuthority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      email: string;
      password: string;
      display_name: string;
      role_title: string;
      department?: string | null;
    }) => {
      const { data, error } = await (supabase.rpc as any)("manage_authority_rpc", {
        p_action: "create",
        p_email: params.email,
        p_password: params.password,
        p_display_name: params.display_name,
        p_role_title: params.role_title,
        p_department: params.department ?? null
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorities"] });
    },
  });
}

export function useUpdateAuthority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      authority_user_id: string;
      display_name?: string;
      role_title?: string;
      is_active?: boolean;
      department?: string | null;
    }) => {
      const { data, error } = await (supabase.rpc as any)("manage_authority_rpc", {
        p_action: "update",
        p_authority_user_id: params.authority_user_id,
        p_display_name: params.display_name,
        p_role_title: params.role_title,
        p_is_active: params.is_active,
        p_department: params.department
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorities"] });
    },
  });
}

export function useDeleteAuthority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (authorityUserId: string) => {
      const { data, error } = await (supabase.rpc as any)("manage_authority_rpc", {
        p_action: "delete", p_authority_user_id: authorityUserId
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorities"] });
    },
  });
}
