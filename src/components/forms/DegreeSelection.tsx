import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UG_DEGREES, BRANCHES, YEARS, SECTIONS } from "@/lib/constants";

interface DegreeSelectionProps {
  degree: string;
  branch: string;
  year: string;
  section: string;
  onChange: (field: string, value: string) => void;
}

const DegreeSelection = ({
  degree,
  branch,
  year,
  section,
  onChange,
}: DegreeSelectionProps) => {
  const availableBranches = degree ? BRANCHES[degree] || [] : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="degree">UG Degree *</Label>
        <Select
          value={degree}
          onValueChange={(value) => {
            onChange("degree", value);
            onChange("branch", ""); // Reset branch when degree changes
          }}
        >
          <SelectTrigger className="input-styled">
            <SelectValue placeholder="Select your degree" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {UG_DEGREES.map((deg) => (
              <SelectItem key={deg.value} value={deg.value}>
                {deg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="branch">Branch/Department *</Label>
        <Select
          value={branch}
          onValueChange={(value) => onChange("branch", value)}
          disabled={!degree}
        >
          <SelectTrigger className="input-styled">
            <SelectValue placeholder={degree ? "Select branch" : "Select degree first"} />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {availableBranches.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="year">Year of Study *</Label>
        <Select
          value={year}
          onValueChange={(value) => onChange("year", value)}
        >
          <SelectTrigger className="input-styled">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {YEARS.map((y) => (
              <SelectItem key={y.value} value={y.value}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="section">Section *</Label>
        <Select
          value={section}
          onValueChange={(value) => onChange("section", value)}
        >
          <SelectTrigger className="input-styled">
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {SECTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default DegreeSelection;
