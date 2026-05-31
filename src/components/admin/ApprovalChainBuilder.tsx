import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    GripVertical, Plus, Trash2, Save, Link2, ChevronDown, ChevronUp, Building2,
} from "lucide-react";
import { useTemplates } from "@/hooks/useTemplates";
import { useAuthorities } from "@/hooks/useAuthorities";
import { useTemplateApprovalChain, useSaveApprovalChain } from "@/hooks/useApprovalChain";
import { toast } from "sonner";
import { getCertificateTypeLabel } from "@/hooks/useCertificates";

interface ChainStep {
    authority_user_id: string;
    approval_order: number;
    is_department_role: boolean;
}

// Inner component: manages the chain for one template
const TemplateChainEditor = ({
    templateId,
    templateName,
}: {
    templateId: string;
    templateName: string;
}) => {
    const { data: authorities, isLoading: authLoading } = useAuthorities();
    const { data: existingChain, isLoading: chainLoading } = useTemplateApprovalChain(templateId);
    const saveChain = useSaveApprovalChain();

    const [steps, setSteps] = useState<ChainStep[] | null>(null);
    const [expanded, setExpanded] = useState(false);

    // Once loaded, init local state only if not yet initialized
    const chain: ChainStep[] =
        steps !== null
            ? steps
            : (existingChain ?? []).map((s) => ({
                authority_user_id: s.authority_user_id,
                approval_order: s.approval_order,
                is_department_role: s.is_department_role ?? false,
            }));

    const setChain = (next: ChainStep[]) => setSteps(next);

    const addStep = () => {
        const nextOrder = chain.length > 0 ? Math.max(...chain.map((s) => s.approval_order)) + 1 : 1;
        setChain([...chain, { authority_user_id: "", approval_order: nextOrder, is_department_role: false }]);
    };

    const removeStep = (idx: number) => {
        const next = chain.filter((_, i) => i !== idx).map((s, i) => ({ ...s, approval_order: i + 1 }));
        setChain(next);
    };

    const moveStep = (idx: number, dir: "up" | "down") => {
        const next = [...chain];
        const target = dir === "up" ? idx - 1 : idx + 1;
        if (target < 0 || target >= next.length) return;
        [next[idx], next[target]] = [next[target], next[idx]];
        setChain(next.map((s, i) => ({ ...s, approval_order: i + 1 })));
    };

    const updateAuthority = (idx: number, userId: string) => {
        const next = [...chain];
        next[idx] = { ...next[idx], authority_user_id: userId };
        setChain(next);
    };

    const updateDeptRole = (idx: number, val: boolean) => {
        const next = [...chain];
        next[idx] = { ...next[idx], is_department_role: val };
        setChain(next);
    };

    const handleSave = async () => {
        const invalid = chain.some((s) => !s.authority_user_id);
        if (invalid) {
            toast.error("Please select an authority for every step");
            return;
        }
        const hasDuplicates = new Set(chain.map((s) => s.authority_user_id)).size !== chain.length;
        if (hasDuplicates) {
            toast.error("Each authority can only appear once in the chain");
            return;
        }
        try {
            await saveChain.mutateAsync({ templateId, chain });
            toast.success(`Approval chain saved for ${templateName}`);
            setSteps(null); // reset to refetch
        } catch (err: any) {
            toast.error(err.message || "Failed to save chain");
        }
    };

    const isLoading = authLoading || chainLoading;

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Header row */}
            <button
                type="button"
                className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                onClick={() => setExpanded((v) => !v)}
            >
                <div className="flex items-center gap-3">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{templateName}</span>
                    {chain.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                            {chain.length} step{chain.length !== 1 ? "s" : ""}
                        </Badge>
                    )}
                    {chain.length === 0 && (
                        <Badge variant="secondary" className="text-xs text-muted-foreground">
                            No chain configured
                        </Badge>
                    )}
                </div>
                {expanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
            </button>

            {/* Chain editor */}
            {expanded && (
                <div className="p-4 space-y-3 bg-background">
                    {isLoading ? (
                        <div className="space-y-2">
                            {[1, 2].map((i) => (
                                <Skeleton key={i} className="h-14 w-full" />
                            ))}
                        </div>
                    ) : (
                        <>
                            {chain.length === 0 && (
                                <p className="text-sm text-muted-foreground py-2">
                                    No approval steps yet. Add authorities below to configure the chain.
                                </p>
                            )}

                            {chain.map((step, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-col gap-2 p-3 rounded-lg border bg-secondary/10"
                                >
                                    {/* Top row: order controls + select + delete */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center gap-0.5">
                                            <button
                                                type="button"
                                                disabled={idx === 0}
                                                onClick={() => moveStep(idx, "up")}
                                                className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                                            >
                                                <ChevronUp className="h-3.5 w-3.5" />
                                            </button>
                                            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                                            <button
                                                type="button"
                                                disabled={idx === chain.length - 1}
                                                onClick={() => moveStep(idx, "down")}
                                                className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                                            >
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            </button>
                                        </div>

                                        <Badge className="h-7 w-7 flex items-center justify-center rounded-full p-0 text-xs shrink-0">
                                            {step.approval_order}
                                        </Badge>

                                        <Select
                                            value={step.authority_user_id}
                                            onValueChange={(val) => updateAuthority(idx, val)}
                                        >
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="Select authority..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(authorities ?? [])
                                                    .filter((a) => a.is_active)
                                                    .map((a) => (
                                                        <SelectItem key={a.user_id} value={a.user_id}>
                                                            {a.display_name} — {a.role_title}
                                                            {a.department ? ` (${a.department.toUpperCase()})` : ""}
                                                        </SelectItem>
                                                    ))}
                                                {(authorities ?? []).filter((a) => !a.is_active).length > 0 && (
                                                    <>
                                                        <div className="px-2 py-1 text-xs text-muted-foreground border-t mt-1 pt-2">
                                                            Inactive
                                                        </div>
                                                        {(authorities ?? [])
                                                            .filter((a) => !a.is_active)
                                                            .map((a) => (
                                                                <SelectItem
                                                                    key={a.user_id}
                                                                    value={a.user_id}
                                                                    disabled
                                                                    className="opacity-50"
                                                                >
                                                                    {a.display_name} — {a.role_title}
                                                                </SelectItem>
                                                            ))}
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>

                                        <button
                                            type="button"
                                            onClick={() => removeStep(idx)}
                                            className="p-1.5 rounded text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Department-specific toggle row */}
                                    <div className="flex items-center gap-2 pl-14">
                                        <Switch
                                            id={`dept-role-${templateId}-${idx}`}
                                            checked={step.is_department_role}
                                            onCheckedChange={(val) => updateDeptRole(idx, val)}
                                        />
                                        <Label
                                            htmlFor={`dept-role-${templateId}-${idx}`}
                                            className="text-xs cursor-pointer"
                                        >
                                            Department-specific
                                        </Label>
                                        {step.is_department_role && (
                                            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                                                <Building2 className="h-3 w-3" />
                                                Auto-routes to student's dept authority
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="flex items-center justify-between pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={addStep}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Step
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={saveChain.isPending || steps === null}
                                    className="min-w-[100px]"
                                >
                                    <Save className="h-4 w-4 mr-1" />
                                    {saveChain.isPending ? "Saving..." : "Save Chain"}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// Main component: shows all templates with their chain editors
const ApprovalChainBuilder = () => {
    const { data: templates, isLoading } = useTemplates();

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
        );
    }

    const activeTemplates = (templates ?? []).filter((t) => t.is_active);

    if (activeTemplates.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active templates found</p>
                <p className="text-sm">Create templates in the Templates tab first</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
                Configure who approves each certificate type and in what order. Enable
                "Department-specific" on a step to automatically route it to the correct
                department's authority based on the student's branch.
            </p>
            {activeTemplates.map((t) => (
                <TemplateChainEditor
                    key={t.id}
                    templateId={t.id}
                    templateName={
                        t.template_name ||
                        getCertificateTypeLabel(t.certificate_type ?? "") ||
                        "Custom Template"
                    }
                />
            ))}
        </div>
    );
};

export default ApprovalChainBuilder;
