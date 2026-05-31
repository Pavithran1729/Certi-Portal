import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  LogOut, CheckCircle2, XCircle, Clock, Eye, Shield, Inbox, FileText, Settings,
  User, Calendar, BookOpen, Info,
} from "lucide-react";
import CollegeLogo from "@/components/CollegeLogo";
import NotificationBell from "@/components/admin/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCertificateTypeLabel } from "@/hooks/useCertificates";
import { useAuthorityPendingApprovals, useApproveRejectCertificate, useCertificateApprovals } from "@/hooks/useApprovalChain";
import { useAuthorities } from "@/hooks/useAuthorities";

// Helper to prettify camelCase / snake_case keys
function prettifyKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

// Render form_data object as readable key-value pairs
function FormDataView({ formData }: { formData: Record<string, any> }) {
  const entries = Object.entries(formData).filter(([, v]) => v !== "" && v !== null && v !== undefined);
  if (entries.length === 0) return <p className="text-sm text-muted-foreground italic">No additional details provided.</p>;
  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[160px_1fr] gap-2 text-sm">
          <span className="font-medium text-muted-foreground">{prettifyKey(key)}</span>
          <span className="text-foreground">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

const AuthorityDashboard = () => {
  const navigate = useNavigate();
  const { data: approvals, isLoading } = useAuthorityPendingApprovals();
  const { data: authorities } = useAuthorities();
  const approveReject = useApproveRejectCertificate();

  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "approve" | "reject";
    certificateId: string;
    cert: any | null;
  }>({ open: false, action: "approve", certificateId: "", cert: null });
  const [remarks, setRemarks] = useState("");

  const [detailApproval, setDetailApproval] = useState<any | null>(null);
  const detailCertId = detailApproval?.certificate_id ?? null;
  const { data: detailApprovals } = useCertificateApprovals(detailCertId ?? undefined);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const getAuthorityName = (userId: string) => {
    const auth = (authorities ?? []).find((a) => a.user_id === userId);
    return auth ? `${auth.display_name} (${auth.role_title})` : "Admin";
  };

  const isPreviousPending = (approval: any) => {
    if (approval.approval_order <= 1) return false;
    return approval.status === "pending" && approval.approval_order > 1;
  };

  const handleAction = (action: "approve" | "reject", approval: any) => {
    setActionDialog({ open: true, action, certificateId: approval.certificate_id, cert: approval.certificates });
    setRemarks("");
  };

  const handleConfirm = async () => {
    try {
      await approveReject.mutateAsync({
        certificateId: actionDialog.certificateId,
        action: actionDialog.action,
        remarks,
      });
      toast.success(`Certificate ${actionDialog.action}d successfully`);
      setActionDialog({ open: false, action: "approve", certificateId: "", cert: null });
    } catch (err: any) {
      toast.error(err.message || "Failed to process");
    }
  };

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

  const detailCert = detailApproval?.certificates;
  const detailStudent = detailCert?.profiles;

  return (
    <div className="min-h-screen bg-background">
      <header className="college-header text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CollegeLogo variant="light" size="md" />
              <div className="hidden sm:block h-8 w-px bg-white/20" />
              <span className="hidden sm:block text-sm text-white/70">Authority Portal</span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => navigate("/settings")}>
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" onClick={handleLogout} className="text-white hover:bg-white/10">
                <LogOut className="h-4 w-4 mr-2" />Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <h1 className="font-serif text-3xl font-bold text-foreground">Authority Dashboard</h1>
          <p className="text-muted-foreground mt-1">Review and approve certificate requests</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Certificate Approvals
            </CardTitle>
            <CardDescription>Certificates assigned to you for approval</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : (approvals ?? []).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending approvals</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Student</TableHead>
                      <TableHead>Certificate</TableHead>
                      <TableHead>Applied On</TableHead>
                      <TableHead>Your Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(approvals ?? []).map((approval: any) => {
                      const cert = approval.certificates;
                      const student = cert?.profiles;
                      const waiting = isPreviousPending(approval);

                      return (
                        <TableRow key={approval.id} className="hover:bg-secondary/30">
                          <TableCell>
                            <div>
                              <p className="font-medium">{student?.full_name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{student?.roll_number ?? "—"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {cert ? getCertificateTypeLabel(cert.certificate_type) : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {cert?.application_date ? new Date(cert.application_date).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">Step #{approval.approval_order}</Badge>
                          </TableCell>
                          <TableCell>
                            {approval.status === "pending" && waiting ? (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Waiting for previous
                              </Badge>
                            ) : (
                              getStatusBadge(approval.status)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="View Details & Reason"
                                onClick={() => setDetailApproval(approval)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {approval.status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-success hover:text-success hover:bg-success/10"
                                    onClick={() => handleAction("approve", approval)}
                                    title="Approve"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleAction("reject", approval)}
                                    title="Reject"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Certificate Detail Dialog ─── */}
        <Dialog open={!!detailApproval} onOpenChange={(open) => !open && setDetailApproval(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Certificate Request Details
              </DialogTitle>
              <DialogDescription>
                {detailCert ? getCertificateTypeLabel(detailCert.certificate_type) : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Student Info */}
              {detailStudent && (
                <div className="rounded-lg bg-secondary/40 p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Student Information
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{detailStudent.full_name || "—"}</span>
                    <span className="text-muted-foreground">Roll Number</span>
                    <span className="font-medium">{detailStudent.roll_number || "—"}</span>
                    <span className="text-muted-foreground">Branch</span>
                    <span className="font-medium">{detailStudent.branch || "—"}</span>
                    <span className="text-muted-foreground">Year</span>
                    <span className="font-medium">{detailStudent.year || "—"}</span>
                    <span className="text-muted-foreground">Section</span>
                    <span className="font-medium">{detailStudent.section || "—"}</span>
                  </div>
                </div>
              )}

              {/* Request Details / Reason */}
              {detailCert?.form_data && Object.keys(detailCert.form_data).length > 0 && (
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-1 mb-3">
                    <Info className="h-3 w-3" /> Request Reason & Details
                  </p>
                  <FormDataView formData={detailCert.form_data} />
                </div>
              )}

              <Separator />

              {/* Approval Chain */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-3">
                  <BookOpen className="h-3 w-3" /> Approval Chain Progress
                </p>
                <div className="space-y-2">
                  {(detailApprovals ?? []).map((step: any) => (
                    <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg border bg-secondary/20">
                      <Badge className="h-6 w-6 flex items-center justify-center rounded-full p-0 text-xs">
                        {step.approval_order}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{getAuthorityName(step.authority_user_id)}</p>
                        {step.remarks && <p className="text-xs text-muted-foreground">{step.remarks}</p>}
                        {step.acted_at && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {new Date(step.acted_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(step.status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      {/* ─── Action Dialog ─── */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionDialog.action === "approve" ? (
                <><CheckCircle2 className="h-5 w-5 text-success" />Approve Certificate</>
              ) : (
                <><XCircle className="h-5 w-5 text-destructive" />Reject Certificate</>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.cert ? getCertificateTypeLabel(actionDialog.cert.certificate_type) : ""}
              {actionDialog.cert?.profiles?.full_name ? ` — ${actionDialog.cert.profiles.full_name}` : ""}
            </DialogDescription>
          </DialogHeader>

          {/* Show reason summary in action dialog */}
          {actionDialog.cert?.form_data && Object.keys(actionDialog.cert.form_data).length > 0 && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-1 mb-2">
                <Info className="h-3 w-3" /> Student's Reason / Details
              </p>
              <FormDataView formData={actionDialog.cert.form_data} />
            </div>
          )}

          <div className="space-y-2">
            <Label>
              Remarks {actionDialog.action === "reject" && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              placeholder={actionDialog.action === "approve" ? "Optional remarks..." : "Reason for rejection..."}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog((prev) => ({ ...prev, open: false }))}>Cancel</Button>
            <Button
              onClick={handleConfirm}
              disabled={approveReject.isPending || (actionDialog.action === "reject" && !remarks.trim())}
              variant={actionDialog.action === "approve" ? "default" : "destructive"}
            >
              {approveReject.isPending ? "Processing..." : actionDialog.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuthorityDashboard;
