import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Send } from "lucide-react";
import CollegeLogo from "@/components/CollegeLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CertificateTemplate, TemplateField } from "@/hooks/useTemplates";

const CustomCertificatePage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) return;
      const { data, error } = await supabase
        .from("certificate_templates")
        .select("*, template_fields(*)")
        .eq("id", templateId)
        .maybeSingle();

      if (error || !data) {
        toast.error("Template not found");
        navigate("/student/dashboard");
        return;
      }
      setTemplate(data as unknown as CertificateTemplate);
      setLoading(false);
    };
    fetchTemplate();
  }, [templateId, navigate]);

  const sortedFields = (template?.template_fields ?? []).sort(
    (a, b) => a.display_order - b.display_order
  );

  const handleSubmit = async () => {
    if (!template) return;

    // Validate required fields
    for (const field of sortedFields) {
      if (field.is_required && !fieldValues[field.field_name]?.trim()) {
        toast.error(`${field.field_label} is required`);
        return;
      }
      if (
        field.max_length &&
        (fieldValues[field.field_name]?.length ?? 0) > field.max_length
      ) {
        toast.error(`${field.field_label} exceeds max length of ${field.max_length}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Not authenticated");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (!profile) {
        toast.error("Please complete your profile first");
        navigate("/student/profile");
        return;
      }

      // Create certificate record - use template's type, or 'custom' as fallback
      const { data: cert, error: certErr } = await supabase
        .from("certificates")
        .insert({
          student_id: profile.id,
          certificate_type: (template.certificate_type || "custom") as any,
          form_data: fieldValues,
        })
        .select()
        .single();

      if (certErr || !cert) {
        toast.error("Failed to create certificate request");
        return;
      }

      // Create custom application
      const { error: customErr } = await supabase
        .from("custom_certificate_applications")
        .insert({
          certificate_id: cert.id,
          template_id: template.id,
          field_values: fieldValues,
        });

      if (customErr) {
        toast.error("Failed to save application data");
        return;
      }

      toast.success("Certificate application submitted successfully!");
      navigate("/student/applications");
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading template...</p>
      </div>
    );
  }

  if (!template) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="college-header text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => navigate("/student/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CollegeLogo variant="light" size="md" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>{template.template_name}</CardTitle>
            {template.description && (
              <CardDescription>{template.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label>
                  {field.field_label}
                  {field.is_required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderField(field, fieldValues, setFieldValues)}
                {field.max_length && (
                  <p className="text-xs text-muted-foreground">
                    Max {field.max_length} characters
                  </p>
                )}
              </div>
            ))}

            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

function renderField(
  field: TemplateField,
  values: Record<string, string>,
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
) {
  const value = values[field.field_name] ?? "";

  const onChange = (v: string) =>
    setValues((prev) => ({ ...prev, [field.field_name]: v }));

  switch (field.field_type) {
    case "textarea":
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          maxLength={field.max_length ?? undefined}
        />
      );
    case "select":
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder ?? "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(field.options) ? field.options : []).map(
              (opt: string) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      );
    case "date":
      return (
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
        />
      );
    case "email":
      return (
        <Input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          maxLength={field.max_length ?? undefined}
        />
      );
    case "phone":
      return (
        <Input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          maxLength={field.max_length ?? undefined}
        />
      );
    default:
      return (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          maxLength={field.max_length ?? undefined}
        />
      );
  }
}

export default CustomCertificatePage;
