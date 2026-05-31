import { useState, useRef, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Save,
    LayoutTemplate,
    AlignLeft,
    PenLine,
    Tag,
    Upload,
    X,
    ImageIcon,
    Loader2,
    Info,
    GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { type CertificateTemplate } from "@/hooks/useTemplates";

/* ─── Types ─────────────────────────────────────────────── */

export interface TemplateContent {
    header: {
        institution_name: string;
        certificate_title: string;
        logo_url: string;
    };
    body: string;
    footer: {
        signatory_name: string;
        signatory_designation: string;
        show_date: boolean;
    };
}

const DEFAULT_INSTITUTION = "St. Peter's College of Engineering and Technology";

const PROFILE_FIELDS = [
    { name: "name", label: "Student Name", icon: "👤" },
    { name: "roll_number", label: "Roll Number", icon: "🔢" },
    { name: "branch", label: "Branch / Dept.", icon: "🏛️" },
    { name: "year", label: "Year", icon: "📅" },
    { name: "section", label: "Section", icon: "📐" },
    { name: "degree", label: "Degree", icon: "🎓" },
    { name: "email", label: "Email", icon: "✉️" },
];

/* ─── Live Preview ──────────────────────────────────────── */

function CertificatePreview({ content }: { content: TemplateContent }) {
    const renderBody = (text: string) => {
        const parts = text.split(/(<[^>]+>)/g);
        return parts.map((part, i) => {
            const match = part.match(/^<(.+)>$/);
            if (match) {
                return (
                    <span
                        key={i}
                        className="inline-block bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded text-[10px] mx-0.5 border border-blue-200"
                    >
                        {match[1]}
                    </span>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg text-gray-800 text-sm font-serif relative overflow-hidden">
            {/* Decorative page border */}
            <div className="absolute inset-2 border border-gray-200 rounded pointer-events-none" />

            <div className="p-8 relative">
                {/* Header */}
                <div className="text-center border-b-2 border-gray-400 pb-4 mb-6">
                    {content.header.logo_url && (
                        <img
                            src={content.header.logo_url}
                            alt="Logo"
                            className="h-14 mx-auto mb-3 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                    )}
                    <p className="text-[11px] font-bold uppercase tracking-wide leading-tight whitespace-pre-line">
                        {content.header.institution_name || DEFAULT_INSTITUTION}
                    </p>
                    <p className="text-base font-extrabold uppercase tracking-widest mt-3 text-gray-900 underline underline-offset-4">
                        {content.header.certificate_title || "CERTIFICATE"}
                    </p>
                </div>

                {/* Body */}
                <div className="text-[11px] leading-relaxed text-justify min-h-[100px] whitespace-pre-wrap">
                    {content.body ? renderBody(content.body) : (
                        <span className="text-gray-400 italic">Body text will appear here...</span>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-10 flex justify-between items-end">
                    <div>
                        {content.footer.show_date && (
                            <p className="text-[10px] text-gray-500">
                                Date: _______________
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="border-t border-gray-500 pt-1 min-w-[120px]">
                            <p className="text-[11px] font-bold">{content.footer.signatory_name || "Principal"}</p>
                            {content.footer.signatory_designation && (
                                <p className="text-[9px] text-gray-500">{content.footer.signatory_designation}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Section Wrapper ───────────────────────────────────── */

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-secondary/40 border-b">
                <Icon className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">{title}</h3>
            </div>
            <div className="p-4 space-y-4">
                {children}
            </div>
        </div>
    );
}

/* ─── Field Tag Button ──────────────────────────────────── */

function FieldTagButton({ field, onInsert }: { field: { name: string; label: string; icon: string }; onInsert: (name: string) => void }) {
    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={() => onInsert(field.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs hover:bg-blue-100 hover:border-blue-300 transition-all active:scale-95 font-medium cursor-pointer"
                    >
                        <span className="text-[11px]">{field.icon}</span>
                        <span className="font-mono text-[11px]">{field.name}</span>
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                    <p>Insert <code className="bg-blue-100 px-1 rounded">&lt;{field.name}&gt;</code></p>
                    <p className="text-muted-foreground">{field.label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/* ─── Logo Uploader ─────────────────────────────────────── */

function LogoUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Logo must be less than 2MB");
            return;
        }
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file (PNG, JPG, SVG)");
            return;
        }

        setUploading(true);
        try {
            const ext = file.name.split(".").pop();
            const path = `logos/${Date.now()}.${ext}`;

            const { error } = await supabase.storage
                .from("certificate-templates")
                .upload(path, file, { upsert: true });

            if (error) throw error;

            const { data } = supabase.storage
                .from("certificate-templates")
                .getPublicUrl(path);

            onChange(data.publicUrl);
            toast.success("Logo uploaded!");
        } catch (e: any) {
            toast.error(e.message || "Failed to upload logo");
        } finally {
            setUploading(false);
        }
    };

    if (value) {
        return (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-secondary/30">
                <img
                    src={value}
                    alt="Logo"
                    className="h-12 w-12 object-contain rounded border bg-white p-1"
                    onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">Logo uploaded</p>
                    <p className="text-[10px] text-muted-foreground truncate">{value}</p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange("")}
                    className="text-destructive hover:text-destructive shrink-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div
                className={`
                    relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
                    ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
                    ${uploading ? "opacity-50 pointer-events-none" : ""}
                `}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.webp"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                />
                {uploading ? (
                    <Loader2 className="h-6 w-6 mx-auto text-primary animate-spin mb-1" />
                ) : (
                    <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                )}
                <p className="text-xs font-medium">
                    {uploading ? "Uploading..." : "Drop logo here or click to browse"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, SVG — Max 2MB</p>
            </div>
            {/* Fallback: paste a URL instead */}
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">Or paste URL:</span>
                <Input
                    className="h-7 text-xs"
                    placeholder="https://..."
                    onChange={(e) => { if (e.target.value) onChange(e.target.value); }}
                />
            </div>
        </div>
    );
}

/* ─── Main Component ────────────────────────────────────── */

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template: CertificateTemplate | null;
}

const TemplateContentBuilder = ({ open, onOpenChange, template }: Props) => {
    const queryClient = useQueryClient();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [saving, setSaving] = useState(false);

    // Header
    const [institutionName, setInstitutionName] = useState(DEFAULT_INSTITUTION);
    const [certificateTitle, setCertificateTitle] = useState("");
    const [logoUrl, setLogoUrl] = useState("");

    // Body
    const [body, setBody] = useState("");

    // Footer
    const [signatoryName, setSignatoryName] = useState("Principal");
    const [signatoryDesignation, setSignatoryDesignation] = useState(DEFAULT_INSTITUTION);
    const [showDate, setShowDate] = useState(true);

    // Template's own fields (in addition to profile fields)
    const templateFields = (template?.template_fields ?? []).map((f) => ({
        name: f.field_name,
        label: f.field_label,
        icon: "📋",
    }));
    const allFields = [
        ...PROFILE_FIELDS,
        ...templateFields.filter((f) => !PROFILE_FIELDS.find((p) => p.name === f.name)),
    ];

    // Load existing content when dialog opens
    useEffect(() => {
        if (!open || !template) return;

        const existing = (template as any).template_content as TemplateContent | null;
        if (existing) {
            setInstitutionName(existing.header?.institution_name ?? DEFAULT_INSTITUTION);
            setCertificateTitle(existing.header?.certificate_title ?? template.template_name.toUpperCase());
            setLogoUrl(existing.header?.logo_url || "/spcet_logo.png");
            setBody(existing.body ?? "");
            setSignatoryName(existing.footer?.signatory_name ?? "Principal");
            setSignatoryDesignation(existing.footer?.signatory_designation ?? DEFAULT_INSTITUTION);
            setShowDate(existing.footer?.show_date ?? true);
        } else {
            // Defaults
            setInstitutionName(DEFAULT_INSTITUTION);
            setCertificateTitle(template.template_name.toUpperCase());
            setLogoUrl("/spcet_logo.png");
            setBody(`This is to certify that <name> (Roll No: <roll_number>), studying in the ${template.template_name.replace("Certificate", "").trim()} of our institution, is a bonafide student here.`);
            setSignatoryName("Principal");
            setSignatoryDesignation(DEFAULT_INSTITUTION);
            setShowDate(true);
        }
    }, [open, template]);

    const getCurrentContent = useCallback((): TemplateContent => ({
        header: { institution_name: institutionName, certificate_title: certificateTitle, logo_url: logoUrl },
        body,
        footer: { signatory_name: signatoryName, signatory_designation: signatoryDesignation, show_date: showDate },
    }), [institutionName, certificateTitle, logoUrl, body, signatoryName, signatoryDesignation, showDate]);

    // Insert a <field> tag at the textarea cursor
    const insertField = (fieldName: string) => {
        const ta = textareaRef.current;
        if (!ta) {
            setBody((prev) => prev + `<${fieldName}>`);
            return;
        }
        const start = ta.selectionStart ?? body.length;
        const end = ta.selectionEnd ?? body.length;
        const tag = `<${fieldName}>`;
        const newBody = body.substring(0, start) + tag + body.substring(end);
        setBody(newBody);
        setTimeout(() => {
            ta.focus();
            ta.setSelectionRange(start + tag.length, start + tag.length);
        }, 0);
    };

    const handleSave = async () => {
        if (!template) return;
        if (!body.trim()) {
            toast.error("Please add some body text before saving.");
            return;
        }
        setSaving(true);
        try {
            const content = getCurrentContent();
            const { error } = await supabase
                .from("certificate_templates")
                .update({
                    template_content: content as any,
                    // Clear the old uploaded file so it doesn't override this design
                    template_url: null,
                })
                .eq("id", template.id);
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
            queryClient.invalidateQueries({ queryKey: ["active-certificate-templates"] });
            toast.success("Template content saved!");
            onOpenChange(false);
        } catch (e: any) {
            toast.error(e.message || "Failed to save template content");
        } finally {
            setSaving(false);
        }
    };

    if (!template) return null;

    const content = getCurrentContent();
    const bodyTags = body.match(/<([^>]+)>/g) || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col p-0">
                {/* Header */}
                <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-lg flex items-center gap-2">
                                <LayoutTemplate className="h-5 w-5 text-primary" />
                                Design Certificate Content
                            </DialogTitle>
                            <DialogDescription className="text-xs mt-0.5">
                                {template.template_name} — Edit all sections below; the live preview updates instantly.
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] gap-1">
                                <Tag className="h-3 w-3" />
                                {bodyTags.length} tag{bodyTags.length !== 1 ? "s" : ""}
                            </Badge>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                size="sm"
                                className="gap-1.5"
                            >
                                {saving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Save className="h-3.5 w-3.5" />
                                )}
                                {saving ? "Saving..." : "Save Template"}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Main Content — Editor + Preview Side by Side */}
                <div className="flex flex-1 overflow-hidden">
                    {/* ─── Left: Editor Panel ─── */}
                    <ScrollArea className="flex-1 border-r">
                        <div className="p-5 space-y-5">
                            {/* HEADER SECTION */}
                            <Section title="Header" icon={LayoutTemplate}>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Institution Name</Label>
                                    <Textarea
                                        value={institutionName}
                                        onChange={(e) => setInstitutionName(e.target.value)}
                                        placeholder="e.g., St. Peter's College of Engineering and Technology"
                                        rows={2}
                                        className="text-sm resize-none"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Use line breaks for multi-line headers (e.g. approval text on a new line).</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Certificate Title</Label>
                                    <Input
                                        value={certificateTitle}
                                        onChange={(e) => setCertificateTitle(e.target.value)}
                                        placeholder="e.g., BONAFIDE CERTIFICATE"
                                        className="font-semibold uppercase"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Logo</Label>
                                    <LogoUploader value={logoUrl} onChange={setLogoUrl} />
                                </div>
                            </Section>

                            {/* BODY SECTION */}
                            <Section title="Body Content" icon={AlignLeft}>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs flex items-center gap-1">
                                            <Tag className="h-3 w-3" />
                                            Click a tag to insert at cursor
                                        </Label>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-secondary/40 border">
                                        {allFields.map((f) => (
                                            <FieldTagButton key={f.name} field={f} onInsert={insertField} />
                                        ))}
                                    </div>
                                    <div className="flex items-start gap-1.5 p-2 rounded-md bg-blue-50 border border-blue-100">
                                        <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                                        <p className="text-[10px] text-blue-700">
                                            Tags like <code className="bg-blue-100 px-1 rounded">&lt;name&gt;</code> are replaced with the student's actual data when generating the certificate. Place your cursor in the text below, then click a tag to insert it.
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-1.5">
                                    <Label className="text-xs">Body Text</Label>
                                    <Textarea
                                        ref={textareaRef}
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        rows={12}
                                        placeholder="This is to certify that <name> (Roll No: <roll_number>) ..."
                                        className="font-mono text-sm resize-y min-h-[200px]"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Line breaks are preserved in the generated document.</p>
                                </div>
                            </Section>

                            {/* FOOTER SECTION */}
                            <Section title="Footer / Signatory" icon={PenLine}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Signatory Name</Label>
                                        <Input
                                            value={signatoryName}
                                            onChange={(e) => setSignatoryName(e.target.value)}
                                            placeholder="e.g., Principal"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Designation / Institution</Label>
                                        <Input
                                            value={signatoryDesignation}
                                            onChange={(e) => setSignatoryDesignation(e.target.value)}
                                            placeholder="e.g., Head of Department"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border">
                                    <Switch checked={showDate} onCheckedChange={setShowDate} />
                                    <div>
                                        <p className="text-xs font-medium">Show Issue Date</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            Adds a "Date: ___" line on the bottom-left.
                                        </p>
                                    </div>
                                </div>
                            </Section>
                        </div>
                    </ScrollArea>

                    {/* ─── Right: Live Preview Panel ─── */}
                    <div className="w-[380px] shrink-0 overflow-y-auto bg-muted/30 flex flex-col">
                        <div className="p-4 border-b bg-secondary/30 shrink-0">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <GripVertical className="h-3 w-3" />
                                Live Preview
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Updates as you type</p>
                        </div>
                        <div className="p-4 flex-1">
                            <CertificatePreview content={content} />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TemplateContentBuilder;
