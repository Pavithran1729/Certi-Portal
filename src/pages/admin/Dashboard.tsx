import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileText, Users, Clock, CheckCircle2, XCircle, LogOut,
  Search, Eye, Filter, Inbox, LayoutTemplate, ClipboardList, Shield, Link2, Settings,
} from "lucide-react";
import NotificationBell from "@/components/admin/NotificationBell";
import CollegeLogo from "@/components/CollegeLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminCertificates, useAdminStats, useUpdateCertificateStatus,
  getCertificateTypeLabel, type CertificateWithStudent,
} from "@/hooks/useCertificates";
import CertificateActionDialog from "@/components/admin/CertificateActionDialog";
import CertificateDetailDialog from "@/components/admin/CertificateDetailDialog";
import TemplateManager from "@/components/admin/TemplateManager";
import AuthorityManager from "@/components/admin/AuthorityManager";
import ApprovalChainBuilder from "@/components/admin/ApprovalChainBuilder";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "approve" | "reject";
    certificateId: string;
  }>({ open: false, action: "approve", certificateId: "" });

  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    certificate: CertificateWithStudent | null;
  }>({ open: false, certificate: null });

  const { data: certificates, isLoading: certsLoading } = useAdminCertificates();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const updateStatus = useUpdateCertificateStatus();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleAction = (action: "approve" | "reject", certificateId: string) => {
    setActionDialog({ open: true, action, certificateId });
  };

  const handleConfirmAction = async (status: string, remarks: string) => {
    try {
      await updateStatus.mutateAsync({
        certificateId: actionDialog.certificateId,
        status,
        remarks,
      });
      toast.success(`Certificate ${status} successfully`);
      setActionDialog({ open: false, action: "approve", certificateId: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to update certificate");
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

  const filtered = (certificates ?? []).filter((req) => {
    const studentName = req.profiles?.full_name?.toLowerCase() ?? "";
    const rollNumber = req.profiles?.roll_number ?? "";
    const matchesSearch =
      studentName.includes(searchQuery.toLowerCase()) ||
      rollNumber.includes(searchQuery) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const matchesType = typeFilter === "all" || req.certificate_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const statCards = [
    { title: "Total Requests", value: stats?.total ?? 0, icon: FileText, color: "bg-primary" },
    { title: "Pending", value: stats?.pending ?? 0, icon: Clock, color: "bg-warning" },
    { title: "Approved", value: stats?.approved ?? 0, icon: CheckCircle2, color: "bg-success" },
    { title: "Total Students", value: stats?.students ?? 0, icon: Users, color: "bg-accent" },
    { title: "Authorities", value: stats?.authorities ?? 0, icon: Shield, color: "bg-secondary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="college-header text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CollegeLogo variant="light" size="md" />
              <div className="hidden sm:block h-8 w-px bg-white/20" />
              <span className="hidden sm:block text-sm text-white/70">Admin Portal</span>
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
          <h1 className="font-serif text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage certificate templates and student applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <Card key={i} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    {statsLoading ? (
                      <Skeleton className="h-9 w-16 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs: Templates & Applications */}
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 h-12 p-1 bg-secondary">
            <TabsTrigger value="applications" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 rounded-md font-medium">
              <ClipboardList className="h-4 w-4" />Applications
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 rounded-md font-medium">
              <LayoutTemplate className="h-4 w-4" />Templates
            </TabsTrigger>
            <TabsTrigger value="authorities" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 rounded-md font-medium">
              <Shield className="h-4 w-4" />Authorities
            </TabsTrigger>
            <TabsTrigger value="approval-chain" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 rounded-md font-medium">
              <Link2 className="h-4 w-4" />Approval Chain
            </TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-xl">Certificate Applications</CardTitle>
                <CardDescription>Review and manage all certificate requests from students</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by name, roll number..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]"><FileText className="h-4 w-4 mr-2" /><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="tc">Transfer Certificate</SelectItem>
                      <SelectItem value="bonafide">Bonafide Certificate</SelectItem>
                      <SelectItem value="attendance">Attendance Certificate</SelectItem>
                      <SelectItem value="conduct">Conduct Certificate</SelectItem>
                      <SelectItem value="training">Training Certificate</SelectItem>
                      <SelectItem value="course_completion">Course Completion Certificate</SelectItem>
                      <SelectItem value="internship">Internship Training Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {certsLoading ? (
                  <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : filtered.length > 0 ? (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50">
                          <TableHead>Student</TableHead>
                          <TableHead>Certificate Type</TableHead>
                          <TableHead>Branch</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((req) => (
                          <TableRow key={req.id} className="hover:bg-secondary/30">
                            <TableCell>
                              <div>
                                <p className="font-medium">{req.profiles?.full_name || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">{req.profiles?.roll_number ?? "—"}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getCertificateTypeLabel(req.certificate_type)}</TableCell>
                            <TableCell>{req.profiles?.branch ?? "—"}</TableCell>
                            <TableCell>{new Date(req.application_date).toLocaleDateString()}</TableCell>
                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => setDetailDialog({ open: true, certificate: req })} title="View Details">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {req.status === "pending" && (
                                  <>
                                    {/* Hide manual approve button if there is an active approval chain */}
                                    {(!req.certificate_approvals || req.certificate_approvals.length === 0) ? (
                                      <Button variant="ghost" size="sm" className="text-success hover:text-success hover:bg-success/10" onClick={() => handleAction("approve", req.id)} title="Approve">
                                        <CheckCircle2 className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      <div className="text-[10px] text-muted-foreground mr-2 font-medium bg-secondary/50 px-2 py-1 rounded">
                                        Waiting for Authorities ({req.certificate_approvals.filter((a: any) => a.status === 'approved').length}/{req.certificate_approvals.length})
                                      </div>
                                    )}
                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleAction("reject", req.id)} title="Reject">
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No requests found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-xl">Certificate Templates</CardTitle>
                <CardDescription>Upload and manage certificate template designs for each type</CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authorities Tab */}
          <TabsContent value="authorities">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-xl">Authority Management</CardTitle>
                <CardDescription>Create and manage authority logins for certificate approval workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <AuthorityManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approval Chain Tab */}
          <TabsContent value="approval-chain">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-xl">Approval Chain Configuration</CardTitle>
                <CardDescription>Define who approves each certificate type and in what order (e.g. HOD → Certificate Section → Principal)</CardDescription>
              </CardHeader>
              <CardContent>
                <ApprovalChainBuilder />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <CertificateActionDialog
        open={actionDialog.open}
        onOpenChange={(open) => setActionDialog((prev) => ({ ...prev, open }))}
        action={actionDialog.action}
        onConfirm={handleConfirmAction}
        loading={updateStatus.isPending}
      />
      <CertificateDetailDialog
        open={detailDialog.open}
        onOpenChange={(open) => setDetailDialog((prev) => ({ ...prev, open }))}
        certificate={detailDialog.certificate}
      />
    </div>
  );
};

export default AdminDashboard;
