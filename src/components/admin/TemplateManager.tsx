import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Upload,
  Image,
  Plus,
  Trash2,
  Settings2,
  X,
  Download,
  PenLine,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { useTemplates, useUpdateTemplate, useUploadTemplate, useDeleteTemplate, useRemoveTemplateFile, type CertificateTemplate } from "@/hooks/useTemplates";
import { toast } from "sonner";
import CreateTemplateDialog from "./CreateTemplateDialog";
import EditTemplateDialog from "./EditTemplateDialog";
import TemplateContentBuilder from "./TemplateContentBuilder";
import TemplatePreviewDialog from "./TemplatePreviewDialog";
import JSZip from "jszip";

/**
 * Extract all text content from a .docx file by reading its XML entries.
 * Joins text runs without separator to reconstruct tags that Word may split
 * across multiple <w:t> elements (e.g., "<", "field_name", ">").
 */
async function extractDocxText(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const textParts: string[] = [];

  // Read main document.xml
  const docXml = zip.file("word/document.xml");
  if (!docXml) throw new Error("Invalid Word document: missing document.xml");
  const xml = await docXml.async("text");

  const regex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    textParts.push(match[1]);
  }

  // Also check headers/footers which may contain tags
  for (const [path, entry] of Object.entries(zip.files)) {
    if ((path.startsWith("word/header") || path.startsWith("word/footer")) && path.endsWith(".xml")) {
      const partXml = await entry.async("text");
      let m;
      const partRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
      while ((m = partRegex.exec(partXml)) !== null) {
        textParts.push(m[1]);
      }
    }
  }

  // Join without spaces so split tags like "<" + "field" + ">" become "<field>"
  // Decode XML entities so &lt;name&gt; becomes <name>
  const raw = textParts.join("");
  return raw
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Extract all text content from a .pptx file by reading slide XMLs.
 */
async function extractPptxText(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const textParts: string[] = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (path.startsWith("ppt/slides/slide") && path.endsWith(".xml")) {
      const xml = await entry.async("text");
      const regex = /<a:t>([\s\S]*?)<\/a:t>/g;
      let match;
      while ((match = regex.exec(xml)) !== null) {
        textParts.push(match[1]);
      }
    }
  }
  const raw = textParts.join("");
  return raw
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Validate that the uploaded document contains <field_name> tags
 * for every field defined in the template.
 */
async function validateTemplateTags(
  file: File,
  fields: { field_name: string; field_label: string; match_required: boolean }[]
): Promise<{ valid: boolean; errors: string[] }> {
  const isDocx = file.name.toLowerCase().endsWith(".docx");
  const isPptx = file.name.toLowerCase().endsWith(".pptx");

  if (!isDocx && !isPptx) {
    return { valid: false, errors: ["Only .docx (Word) or .pptx (PowerPoint) files are allowed."] };
  }

  let text: string;
  try {
    text = isDocx ? await extractDocxText(file) : await extractPptxText(file);
  } catch {
    return { valid: false, errors: ["Failed to read the uploaded document. Ensure it is a valid Word or PowerPoint file."] };
  }

  const matchFields = fields.filter((f) => f.match_required);
  if (matchFields.length === 0) {
    return { valid: true, errors: [] };
  }

  // Normalize text: collapse whitespace and lowercase for robust matching
  const normalizedText = text.replace(/\s+/g, " ").toLowerCase();

  const errors: string[] = [];
  for (const field of matchFields) {
    const tag = `<${field.field_name}>`.toLowerCase();
    // Also try without angle brackets in case XML parsing stripped them
    const bareTag = field.field_name.toLowerCase();
    // Check multiple variations: exact tag, tag with spaces around brackets, or bare field name
    const tagVariations = [
      tag,
      `< ${bareTag} >`,
      `< ${bareTag}>`,
      `<${bareTag} >`,
    ];
    const found = tagVariations.some((v) => normalizedText.includes(v));
    if (!found) {
      errors.push(`Missing tag "<${field.field_name}>" for field "${field.field_label}" in the uploaded document.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

const TemplateManager = () => {
  const { data: templates, isLoading } = useTemplates();
  const updateTemplate = useUpdateTemplate();
  const uploadTemplate = useUploadTemplate();
  const deleteTemplate = useDeleteTemplate();
  const removeTemplateFile = useRemoveTemplateFile();

  const [createOpen, setCreateOpen] = useState(false);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    template: CertificateTemplate | null;
  }>({ open: false, template: null });
  const [builderDialog, setBuilderDialog] = useState<{
    open: boolean;
    template: CertificateTemplate | null;
  }>({ open: false, template: null });
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    template: CertificateTemplate | null;
  }>({ open: false, template: null });
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleToggleActive = async (template: CertificateTemplate) => {
    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        is_active: !template.is_active,
      });
      toast.success(`Template ${template.is_active ? "deactivated" : "activated"}`);
    } catch {
      toast.error("Failed to update template");
    }
  };

  const handleDelete = async (template: CertificateTemplate) => {
    if (!confirm(`Delete "${template.template_name}"? This cannot be undone.`)) return;
    try {
      await deleteTemplate.mutateAsync(template.id);
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    }
  };

  const handleRemoveFile = async (template: CertificateTemplate) => {
    if (!confirm("Remove the uploaded template file?")) return;
    try {
      await removeTemplateFile.mutateAsync(template.id);
      toast.success("Template file removed");
    } catch {
      toast.error("Failed to remove template file");
    }
  };

  const handleFileUpload = async (template: CertificateTemplate, file: File) => {
    const ext = file.name.toLowerCase().split(".").pop();
    if (ext !== "docx" && ext !== "pptx") {
      toast.error("Only Word (.docx) or PowerPoint (.pptx) files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be less than 10MB");
      return;
    }

    setUploadingId(template.id);
    try {
      const fields = (template.template_fields ?? []).map((f) => ({
        field_name: f.field_name,
        field_label: f.field_label,
        match_required: f.match_required ?? false,
      }));

      const { valid, errors } = await validateTemplateTags(file, fields);
      if (!valid) {
        errors.forEach((err) => toast.error(err));
        return;
      }

      await uploadTemplate.mutateAsync({ file, templateId: template.id });
      toast.success("Template file uploaded successfully");
    } catch {
      toast.error("Failed to upload template file");
    } finally {
      setUploadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {(templates ?? []).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No certificate templates yet</p>
          <p className="text-sm">Create your first template to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(templates ?? []).map((template) => (
            <Card key={template.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.template_name}</CardTitle>
                      {template.description && (
                        <CardDescription className="text-xs">{template.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Preview */}
                {template.template_url ? (
                  <div className="relative rounded-lg border bg-secondary/30 overflow-hidden h-28 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <FileText className="h-8 w-8" />
                      <span className="text-xs">
                        {template.template_url.endsWith(".pptx") ? "PowerPoint" : "Word"} Template
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveFile(template)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (template as any).template_content ? (
                  <div className="rounded-lg border-2 border-primary/30 bg-primary/5 h-28 flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="h-7 w-7 text-primary" />
                    <span className="text-xs font-medium text-primary">Content Designed ✓</span>
                    <span className="text-[10px] text-muted-foreground">Click ✏️ to edit</span>
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed bg-secondary/20 h-28 flex flex-col items-center justify-center text-muted-foreground">
                    <Image className="h-6 w-6 mb-1 opacity-50" />
                    <span className="text-xs">No template yet</span>
                    <span className="text-[10px] mt-0.5">Upload a file or click ✏️ to design</span>
                  </div>
                )}

                {/* Fields count & tag hint */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{(template.template_fields ?? []).length} field(s) configured</p>
                  {(template.template_fields ?? []).filter((f) => f.match_required).length > 0 && (
                    <p className="text-[10px] italic">
                      Tags required in document:{" "}
                      {(template.template_fields ?? []).filter((f) => f.match_required).map((f) => `<${f.field_name}>`).join(", ")}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2"
                    onClick={() => setPreviewDialog({ open: true, template })}
                    title="Preview Template Content"
                    disabled={!template.template_url && !(template as any).template_content}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {/* Design Content button - always visible */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setBuilderDialog({ open: true, template })}
                    title="Design certificate content"
                  >
                    <PenLine className="h-3 w-3 mr-1" />
                    {(template as any).template_content ? "Edit Content" : "Design"}
                  </Button>

                  {/* Upload docx (legacy) */}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={uploadingId === template.id}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".docx,.pptx";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleFileUpload(template, file);
                      };
                      input.click();
                    }}
                    title={template.template_url ? "Replace uploaded file" : "Upload .docx file instead"}
                  >
                    {uploadingId === template.id ? (
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                  </Button>

                  {template.template_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const fileUrl = template.template_url as string;
                        const link = document.createElement('a');
                        link.href = fileUrl;
                        link.download = `template_${template.template_name}`;
                        link.target = "_blank";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      title="Download existing .docx file"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditDialog({ open: true, template })}
                    title="Edit Template"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(template)}
                    title="Delete Template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={() => handleToggleActive(template)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTemplateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditTemplateDialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog((prev) => ({ ...prev, open }))}
        template={editDialog.template}
      />
      <TemplateContentBuilder
        open={builderDialog.open}
        onOpenChange={(open) => setBuilderDialog((prev) => ({ ...prev, open }))}
        template={builderDialog.template}
      />
      <TemplatePreviewDialog
        open={previewDialog.open}
        onOpenChange={(open) => setPreviewDialog((prev) => ({ ...prev, open }))}
        template={previewDialog.template}
      />
    </>
  );
};

export default TemplateManager;
