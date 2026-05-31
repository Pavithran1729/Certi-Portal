import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCertificateTypeLabel, type CertificateWithStudent } from "@/hooks/useCertificates";
import { CheckCircle2, Clock, XCircle, User, FileText, Calendar } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: CertificateWithStudent | null;
}

const CertificateDetailDialog = ({ open, onOpenChange, certificate }: Props) => {
  if (!certificate) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="status-approved"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="status-rejected"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="status-pending"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {getCertificateTypeLabel(certificate.certificate_type)}
          </DialogTitle>
          <DialogDescription>Application details and student information</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {getStatusBadge(certificate.status)}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(certificate.application_date).toLocaleDateString()}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <User className="h-4 w-4" /> Student Information
            </h4>
            {certificate.profiles ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium">{certificate.profiles.full_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Roll Number</p>
                  <p className="text-sm font-medium">{certificate.profiles.roll_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Branch</p>
                  <p className="text-sm font-medium">{certificate.profiles.branch || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Year</p>
                  <p className="text-sm font-medium">{certificate.profiles.year || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Degree</p>
                  <p className="text-sm font-medium">{certificate.profiles.degree || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{certificate.profiles.email || "—"}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Student info not available.</p>
            )}
          </div>

          {certificate.admin_remarks && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2">Admin Remarks</h4>
                <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                  {certificate.admin_remarks}
                </p>
              </div>
            </>
          )}

          {/* Show dynamically submitted form data (e.g. Reason) */}
          {certificate.form_data && Object.keys(certificate.form_data).length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3">Submitted Details</h4>
                <div className="space-y-3 bg-secondary/30 p-4 rounded-lg">
                  {Object.entries(certificate.form_data).map(([key, value]) => {
                    // Format key nicely (e.g. fromDate -> From Date)
                    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    
                    return (
                      <div key={key}>
                        <p className="text-xs text-muted-foreground">{formattedKey}</p>
                        <p className="text-sm font-medium whitespace-pre-wrap">{String(value) || "—"}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateDetailDialog;
