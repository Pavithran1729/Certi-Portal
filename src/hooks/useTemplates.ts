import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TemplateField {
  id: string;
  template_id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  match_required: boolean;
  max_length: number | null;
  display_order: number;
  placeholder: string | null;
  options: any;
  created_at: string;
}

export interface CertificateTemplate {
  id: string;
  template_name: string;
  certificate_type: string | null;
  description: string | null;
  template_url: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  template_fields?: TemplateField[];
}

export function useTemplates() {
  return useQuery({
    queryKey: ["certificate-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_templates")
        .select("*, template_fields(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as CertificateTemplate[];
    },
  });
}

export function useActiveTemplates() {
  return useQuery({
    queryKey: ["active-certificate-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_templates")
        .select("*, template_fields(*)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as CertificateTemplate[];
    },
  });
}

export function useRemoveTemplateFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      // Get current template to find file path
      const { data: template } = await supabase
        .from("certificate_templates")
        .select("template_url")
        .eq("id", templateId)
        .single();

      if (template?.template_url) {
        // Extract path from URL
        const url = new URL(template.template_url);
        const pathParts = url.pathname.split("/storage/v1/object/public/certificate-templates/");
        if (pathParts[1]) {
          await supabase.storage
            .from("certificate-templates")
            .remove([decodeURIComponent(pathParts[1])]);
        }
      }

      const { error } = await supabase
        .from("certificate_templates")
        .update({ template_url: null })
        .eq("id", templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      template_name,
      certificate_type,
      description,
      fields,
    }: {
      template_name: string;
      certificate_type?: string;
      description?: string;
      fields?: Omit<TemplateField, "id" | "template_id" | "created_at">[];
    }) => {
      const { data: user } = await supabase.auth.getUser();

      const insertData: any = {
        template_name,
        description: description || null,
        created_by: user.user?.id || null,
      };

      if (certificate_type) {
        insertData.certificate_type = certificate_type;
      }

      const { data: template, error: tErr } = await supabase
        .from("certificate_templates")
        .insert(insertData)
        .select()
        .single();

      if (tErr) throw tErr;

      if (fields && fields.length > 0) {
        const fieldRows = fields.map((f, i) => ({
          template_id: template.id,
          field_name: f.field_name,
          field_label: f.field_label,
          field_type: f.field_type,
          is_required: f.is_required,
          match_required: (f as any).match_required ?? false,
          max_length: f.max_length,
          display_order: i,
          placeholder: f.placeholder,
          options: f.options,
        }));

        const { error: fErr } = await supabase
          .from("template_fields")
          .insert(fieldRows as any);

        if (fErr) throw fErr;
      }

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
      queryClient.invalidateQueries({ queryKey: ["active-certificate-templates"] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      template_name,
      certificate_type,
      description,
      template_url,
      is_active,
    }: {
      id: string;
      template_name?: string;
      certificate_type?: string | null;
      description?: string;
      template_url?: string | null;
      is_active?: boolean;
    }) => {
      const updateData: Record<string, any> = {};
      if (template_name !== undefined) updateData.template_name = template_name;
      if (certificate_type !== undefined) updateData.certificate_type = certificate_type;
      if (description !== undefined) updateData.description = description;
      if (template_url !== undefined) updateData.template_url = template_url;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data, error } = await supabase
        .from("certificate_templates")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
      queryClient.invalidateQueries({ queryKey: ["active-certificate-templates"] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("certificate_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
      queryClient.invalidateQueries({ queryKey: ["active-certificate-templates"] });
    },
  });
}

export function useUploadTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, templateId }: { file: File; templateId: string }) => {
      const ext = file.name.split(".").pop();
      const path = `templates/${templateId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("certificate-templates")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("certificate-templates")
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("certificate_templates")
        .update({
          template_url: urlData.publicUrl,
          // Clear any guided design so the uploaded file takes priority
          template_content: null,
        })
        .eq("id", templateId);

      if (updateError) throw updateError;

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
    },
  });
}
