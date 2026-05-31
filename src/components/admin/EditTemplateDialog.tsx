import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Plus, Trash2 } from "lucide-react";
import { useUpdateTemplate, type CertificateTemplate, type TemplateField } from "@/hooks/useTemplates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "select", label: "Dropdown" },
];

interface FieldDef {
  id?: string; // existing fields have an id
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  match_required: boolean;
  max_length: number | null;
  display_order: number;
  placeholder: string | null;
  options: any;
  _deleted?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CertificateTemplate | null;
}

const EditTemplateDialog = ({ open, onOpenChange, template }: Props) => {
  const updateTemplate = useUpdateTemplate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [certificateType, setCertificateType] = useState<string>("custom");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.template_name);
      setCertificateType(template.certificate_type || "custom");
      setDescription(template.description ?? "");
      setFields(
        (template.template_fields ?? [])
          .sort((a, b) => a.display_order - b.display_order)
          .map((f) => ({
            id: f.id,
            field_name: f.field_name,
            field_label: f.field_label,
            field_type: f.field_type,
            is_required: f.is_required,
            match_required: f.match_required ?? false,
            max_length: f.max_length,
            display_order: f.display_order,
            placeholder: f.placeholder,
            options: f.options,
          }))
      );
    }
  }, [template]);

  const addField = () => {
    setFields((prev) => [
      ...prev,
      {
        field_name: `field_${prev.length + 1}`,
        field_label: "",
        field_type: "text",
        is_required: true,
        match_required: false,
        max_length: null,
        display_order: prev.length,
        placeholder: null,
        options: null,
      },
    ]);
  };

  const updateField = (index: number, updates: Partial<FieldDef>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const removeField = (index: number) => {
    setFields((prev) => {
      const field = prev[index];
      if (field.id) {
        // Mark existing field as deleted
        return prev.map((f, i) => (i === index ? { ...f, _deleted: true } : f));
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSave = async () => {
    if (!template || !name.trim()) return;

    const activeFields = fields.filter((f) => !f._deleted);
    for (const field of activeFields) {
      if (!field.field_label.trim()) {
        toast.error("All fields must have a label");
        return;
      }
    }

    setSaving(true);
    try {
      // Update template name/description
      await updateTemplate.mutateAsync({
        id: template.id,
        template_name: name.trim(),
        certificate_type: certificateType === "custom" ? null : certificateType,
        description: description.trim() || undefined,
      });

      // Delete removed fields
      const deletedIds = fields.filter((f) => f._deleted && f.id).map((f) => f.id!);
      if (deletedIds.length > 0) {
        const { error } = await supabase
          .from("template_fields")
          .delete()
          .in("id", deletedIds);
        if (error) throw error;
      }

      // Upsert existing and new fields
      for (let i = 0; i < activeFields.length; i++) {
        const f = activeFields[i];
        const fieldName = f.field_label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
        const row = {
          template_id: template.id,
          field_name: fieldName,
          field_label: f.field_label,
          field_type: f.field_type,
          is_required: f.is_required,
          match_required: f.match_required,
          max_length: f.max_length,
          display_order: i,
          placeholder: f.placeholder,
          options: f.options,
        };

        if (f.id) {
          const { error } = await supabase
            .from("template_fields")
            .update(row)
            .eq("id", f.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("template_fields")
            .insert(row as any);
          if (error) throw error;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
      queryClient.invalidateQueries({ queryKey: ["active-certificate-templates"] });
      toast.success("Template updated");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update template");
    } finally {
      setSaving(false);
    }
  };

  const activeFields = fields.filter((f) => !f._deleted);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
          <DialogDescription>Update the template name, description, and fields</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Template Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Certificate Type (Optional)</Label>
            <Select
              value={certificateType}
              onValueChange={setCertificateType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Custom (No specific type)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom (No specific type)</SelectItem>
                <SelectItem value="tc">Transfer Certificate</SelectItem>
                <SelectItem value="bonafide">Bonafide Certificate</SelectItem>
                <SelectItem value="attendance">Attendance Certificate</SelectItem>
                <SelectItem value="conduct">Conduct Certificate</SelectItem>
                <SelectItem value="training">Training Certificate</SelectItem>
                <SelectItem value="course_completion">Course Completion Certificate</SelectItem>
                <SelectItem value="internship">Internship Training Letter</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Select a standard type if you are replacing a built-in template, otherwise leave as Custom.</p>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          {/* Fields */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Data Fields</Label>
              <Button variant="outline" size="sm" onClick={addField}>
                <Plus className="h-3 w-3 mr-1" />
                Add Field
              </Button>
            </div>

            {activeFields.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center border-2 border-dashed rounded-lg">
                No fields. Click "Add Field" to start.
              </p>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => {
                if (field._deleted) return null;
                return (
                  <div key={field.id ?? `new-${index}`} className="p-3 rounded-lg border bg-secondary/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {field.id ? "Existing" : "New"} Field
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-destructive hover:text-destructive"
                        onClick={() => removeField(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Label *</Label>
                        <Input
                          value={field.field_label}
                          onChange={(e) => updateField(index, { field_label: e.target.value })}
                          placeholder="e.g., Reason for Transfer"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={field.field_type}
                          onValueChange={(v) => updateField(index, { field_type: v })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Placeholder</Label>
                        <Input
                          value={field.placeholder ?? ""}
                          onChange={(e) => updateField(index, { placeholder: e.target.value || null })}
                          placeholder="Hint text"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max Length</Label>
                        <Input
                          type="number"
                          value={field.max_length ?? ""}
                          onChange={(e) => updateField(index, { max_length: e.target.value ? parseInt(e.target.value) : null })}
                          placeholder="No limit"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2 pb-1">
                        <Switch
                          checked={field.is_required}
                          onCheckedChange={(v) => updateField(index, { is_required: v })}
                        />
                        <Label className="text-xs">Required</Label>
                      </div>
                      <div className="flex items-center gap-2 pb-1">
                        <Switch
                          checked={field.match_required}
                          onCheckedChange={(v) => updateField(index, { match_required: v })}
                        />
                        <Label className="text-xs">Match</Label>
                      </div>
                    </div>

                    {field.field_type === "select" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Options (comma-separated)</Label>
                        <Input
                          value={Array.isArray(field.options) ? field.options.join(", ") : ""}
                          onChange={(e) =>
                            updateField(index, {
                              options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                            })
                          }
                          placeholder="Option 1, Option 2, Option 3"
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTemplateDialog;
