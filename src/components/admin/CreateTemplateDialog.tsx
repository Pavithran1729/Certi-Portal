import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, GripVertical } from "lucide-react";
import { useCreateTemplate } from "@/hooks/useTemplates";
import { useSaveApprovalChain } from "@/hooks/useApprovalChain";
import ApprovalChainSelector from "./ApprovalChainSelector";
import { toast } from "sonner";

interface FieldDef {
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  match_required: boolean;
  max_length: number | null;
  display_order: number;
  placeholder: string | null;
  options: any;
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "select", label: "Dropdown" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateTemplateDialog = ({ open, onOpenChange }: Props) => {
  const createTemplate = useCreateTemplate();
  const saveApprovalChain = useSaveApprovalChain();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [certificateType, setCertificateType] = useState<string>("custom");
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [approvalChain, setApprovalChain] = useState<{ authority_user_id: string; approval_order: number; is_department_role?: boolean }[]>([]);

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
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }
    if (fields.length === 0) {
      toast.error("Add at least one field");
      return;
    }
    if (approvalChain.length === 0) {
      toast.error("Select at least one approval authority");
      return;
    }
    for (const field of fields) {
      if (!field.field_label.trim()) {
        toast.error("All fields must have a label");
        return;
      }
    }

    try {
      const processedFields = fields.map((f, i) => ({
        ...f,
        field_name: f.field_label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
        display_order: i,
      }));

      const template = await createTemplate.mutateAsync({
        template_name: name.trim(),
        certificate_type: certificateType === "custom" ? undefined : certificateType,
        description: description.trim() || undefined,
        fields: processedFields,
      });

      // Save approval chain
      if (template?.id) {
        await saveApprovalChain.mutateAsync({
          templateId: template.id,
          chain: approvalChain,
        });
      }

      toast.success("Template created successfully");
      setName("");
      setDescription("");
      setFields([]);
      setApprovalChain([]);
      onOpenChange(false);
    } catch {
      toast.error("Failed to create template");
    }
  };

  const reset = () => {
    setName("");
    setDescription("");
    setCertificateType("custom");
    setFields([]);
    setApprovalChain([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Certificate Template</DialogTitle>
          <DialogDescription>
            Define the template name and the data fields students will fill in when applying.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Template Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Migration Certificate"
            />
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
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the certificate"
              rows={2}
            />
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

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center border-2 border-dashed rounded-lg">
                No fields added yet. Click "Add Field" to start.
              </p>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-secondary/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Field #{index + 1}
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
                        onChange={(e) =>
                          updateField(index, { field_label: e.target.value })
                        }
                        placeholder="e.g., Reason for Transfer"
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={field.field_type}
                        onValueChange={(v) =>
                          updateField(index, { field_type: v })
                        }
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

                  <div className="grid grid-cols-3 gap-3 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Placeholder</Label>
                      <Input
                        value={field.placeholder ?? ""}
                        onChange={(e) =>
                          updateField(index, {
                            placeholder: e.target.value || null,
                          })
                        }
                        placeholder="Hint text"
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Max Length</Label>
                      <Input
                        type="number"
                        value={field.max_length ?? ""}
                        onChange={(e) =>
                          updateField(index, {
                            max_length: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          })
                        }
                        placeholder="No limit"
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2 pb-1">
                      <Switch
                        checked={field.is_required}
                        onCheckedChange={(v) =>
                          updateField(index, { is_required: v })
                        }
                      />
                      <Label className="text-xs">Required</Label>
                    </div>
                    <div className="flex items-center gap-2 pb-1">
                      <Switch
                        checked={field.match_required}
                        onCheckedChange={(v) =>
                          updateField(index, { match_required: v })
                        }
                      />
                      <Label className="text-xs">Match</Label>
                    </div>
                  </div>

                  {field.field_type === "select" && (
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Options (comma-separated)
                      </Label>
                      <Input
                        value={
                          Array.isArray(field.options)
                            ? field.options.join(", ")
                            : ""
                        }
                        onChange={(e) =>
                          updateField(index, {
                            options: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="Option 1, Option 2, Option 3"
                        className="h-8 text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Approval Chain Selector */}
          <ApprovalChainSelector value={approvalChain} onChange={setApprovalChain} />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={createTemplate.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {createTemplate.isPending ? "Creating..." : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTemplateDialog;
