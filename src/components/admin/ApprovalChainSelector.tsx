import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { X, ArrowUp, ArrowDown, Building2 } from "lucide-react";
import { useAuthorities, type AuthorityProfile } from "@/hooks/useAuthorities";
import { useAuth } from "@/hooks/useAuth";

interface ChainItem {
  authority_user_id: string;
  approval_order: number;
  is_department_role?: boolean;
}

interface ApprovalChainSelectorProps {
  value: ChainItem[];
  onChange: (chain: ChainItem[]) => void;
}

const ApprovalChainSelector = ({ value, onChange }: ApprovalChainSelectorProps) => {
  const { data: authorities, isLoading } = useAuthorities();
  const { user } = useAuth();

  // Build the list of selectable options: authorities + admin
  const options: { user_id: string; label: string; subtitle: string }[] = [
    ...(authorities ?? [])
      .filter((a) => a.is_active)
      .map((a) => ({
        user_id: a.user_id,
        label: a.display_name,
        subtitle: a.department ? `${a.role_title} · ${a.department.toUpperCase()}` : a.role_title,
      })),
    ...(user
      ? [{ user_id: user.id, label: "Admin", subtitle: "Administrator" }]
      : []),
  ];

  const selectedIds = value.map((v) => v.authority_user_id);

  const handleToggle = (userId: string) => {
    if (selectedIds.includes(userId)) {
      // Remove
      const newChain = value
        .filter((v) => v.authority_user_id !== userId)
        .map((v, i) => ({ ...v, approval_order: i + 1 }));
      onChange(newChain);
    } else {
      // Add at end
      onChange([...value, { authority_user_id: userId, approval_order: value.length + 1, is_department_role: false }]);
    }
  };

  const toggleDeptRole = (userId: string, val: boolean) => {
    onChange(value.map((v) =>
      v.authority_user_id === userId ? { ...v, is_department_role: val } : v
    ));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newChain = [...value];
    [newChain[index - 1], newChain[index]] = [newChain[index], newChain[index - 1]];
    onChange(newChain.map((v, i) => ({ ...v, approval_order: i + 1 })));
  };

  const moveDown = (index: number) => {
    if (index >= value.length - 1) return;
    const newChain = [...value];
    [newChain[index], newChain[index + 1]] = [newChain[index + 1], newChain[index]];
    onChange(newChain.map((v, i) => ({ ...v, approval_order: i + 1 })));
  };

  const getOptionLabel = (userId: string) => {
    const opt = options.find((o) => o.user_id === userId);
    return opt ? opt.label : "Unknown";
  };

  const getOptionSubtitle = (userId: string) => {
    const opt = options.find((o) => o.user_id === userId);
    return opt ? opt.subtitle : "";
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading authorities...</p>;

  return (
    <div className="space-y-3">
      <Label>Approval Authorities &amp; Order *</Label>
      <p className="text-xs text-muted-foreground">
        Select authorities and arrange their approval order. Click to select, use arrows to reorder.
      </p>

      {/* Selectable options */}
      <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
        {options.map((opt) => {
          const isSelected = selectedIds.includes(opt.user_id);
          const orderIndex = value.findIndex((v) => v.authority_user_id === opt.user_id);
          return (
            <div
              key={opt.user_id}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-secondary/50 transition-colors ${
                isSelected ? "bg-primary/5" : ""
              }`}
              onClick={() => handleToggle(opt.user_id)}
            >
              <Checkbox checked={isSelected} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.subtitle}</p>
              </div>
              {isSelected && (
                <Badge variant="secondary" className="text-xs">
                  #{orderIndex + 1}
                </Badge>
              )}
            </div>
          );
        })}
        {options.length === 0 && (
          <p className="text-sm text-muted-foreground p-4 text-center">
            No authorities available. Create authorities first.
          </p>
        )}
      </div>

      {/* Selected order display */}
      {value.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs">Approval Order:</Label>
          <div className="space-y-1">
            {value.map((item, index) => (
              <div
                key={item.authority_user_id}
                className="flex flex-col gap-1.5 p-2 rounded-md border bg-secondary/20"
              >
                {/* Main row */}
                <div className="flex items-center gap-2">
                  <Badge className="h-6 w-6 flex items-center justify-center rounded-full p-0 text-xs">
                    {index + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{getOptionLabel(item.authority_user_id)}</p>
                    <p className="text-xs text-muted-foreground">{getOptionSubtitle(item.authority_user_id)}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => { e.stopPropagation(); moveUp(index); }}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => { e.stopPropagation(); moveDown(index); }}
                      disabled={index === value.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleToggle(item.authority_user_id); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Department-specific toggle row */}
                <div className="flex items-center gap-2 pl-8">
                  <Switch
                    id={`selector-dept-${item.authority_user_id}`}
                    checked={item.is_department_role ?? false}
                    onCheckedChange={(val) => toggleDeptRole(item.authority_user_id, val)}
                  />
                  <Label
                    htmlFor={`selector-dept-${item.authority_user_id}`}
                    className="text-xs cursor-pointer"
                  >
                    Department-specific
                  </Label>
                  {item.is_department_role && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                      <Building2 className="h-3 w-3" />
                      Dept auto-routed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalChainSelector;
