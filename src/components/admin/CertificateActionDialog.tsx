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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle } from "lucide-react";

interface CertificateActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "approve" | "reject";
  onConfirm: (status: string, remarks: string) => void;
  loading?: boolean;
}

const CertificateActionDialog = ({
  open,
  onOpenChange,
  action,
  onConfirm,
  loading,
}: CertificateActionDialogProps) => {
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (open) setRemarks("");
  }, [open]);

  const handleConfirm = () => {
    onConfirm(action === "approve" ? "approved" : "rejected", remarks);
    setRemarks("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === "approve" ? (
              <><CheckCircle2 className="h-5 w-5 text-success" />Approve Certificate</>
            ) : (
              <><XCircle className="h-5 w-5 text-destructive" />Reject Certificate</>
            )}
          </DialogTitle>
          <DialogDescription>
            {action === "approve"
              ? "This will approve the certificate request and make it available for the student to download."
              : "Please provide a reason for rejection."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="remarks">
              Remarks {action === "reject" && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="remarks"
              placeholder={action === "approve" ? "Optional remarks..." : "Reason for rejection..."}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || (action === "reject" && !remarks.trim())}
            variant={action === "approve" ? "default" : "destructive"}
          >
            {loading ? "Processing..." : action === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateActionDialog;
