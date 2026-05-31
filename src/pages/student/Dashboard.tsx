import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Award,
  ClipboardCheck,
  UserCheck,
  Briefcase,
  LogOut,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Bell,
  Inbox,
  Settings,
  GraduationCap,
} from "lucide-react";
import CollegeLogo from "@/components/CollegeLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStudentCertificates, getCertificateTypeLabel } from "@/hooks/useCertificates";
import { useActiveTemplates } from "@/hooks/useTemplates";

const certificateTypes = [
  {
    id: "tc",
    title: "Transfer Certificate",
    description: "Request original or duplicate TC",
    icon: FileText,
    color: "bg-blue-500",
    path: "/student/certificates/tc",
  },
  {
    id: "bonafide",
    title: "Bonafide Certificate",
    description: "Proof of enrollment verification",
    icon: Award,
    color: "bg-green-500",
    path: "/student/certificates/bonafide",
  },
  {
    id: "attendance",
    title: "Attendance Certificate",
    description: "Official attendance record",
    icon: ClipboardCheck,
    color: "bg-purple-500",
    path: "/student/certificates/attendance",
  },
  {
    id: "conduct",
    title: "Conduct Certificate",
    description: "Character and conduct verification",
    icon: UserCheck,
    color: "bg-orange-500",
    path: "/student/certificates/conduct",
  },
  {
    id: "training",
    title: "Training Certificate",
    description: "Workshop & internship certificates",
    icon: Briefcase,
    color: "bg-pink-500",
    path: "/student/certificates/training",
  },
  {
    id: "course_completion",
    title: "Course Completion Certificate",
    description: "Official course completion proof",
    icon: GraduationCap,
    color: "bg-teal-600",
    path: "/student/certificates/course_completion",
  },
  {
    id: "internship",
    title: "Internship Training Letter",
    description: "Request internship letter to a company",
    icon: Briefcase,
    color: "bg-indigo-500",
    path: "/student/certificates/internship",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const { data: certificates, isLoading: certsLoading } = useStudentCertificates();
  const { data: customTemplates } = useActiveTemplates();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
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

  const firstName = user?.user_metadata?.first_name || "Student";

  const totalApps = certificates?.length ?? 0;
  const approvedCount = certificates?.filter((c) => c.status === "approved").length ?? 0;
  const pendingCount = certificates?.filter((c) => c.status === "pending").length ?? 0;
  const rejectedCount = certificates?.filter((c) => c.status === "rejected").length ?? 0;

  const recentApps = (certificates ?? []).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="college-header text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <CollegeLogo variant="light" size="md" />
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => navigate("/student/profile")}>
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => navigate("/settings")}>
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" onClick={handleLogout} className="text-white hover:bg-white/10">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <h1 className="font-serif text-3xl font-bold text-foreground">Welcome back, {firstName}!</h1>
          <p className="text-muted-foreground mt-1">Manage your academic certificates from one place</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Navigate to your profile or view all applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => navigate("/student/profile")}>
                  <User className="h-4 w-4 mr-2" /> My Profile
                </Button>
                <Button variant="outline" onClick={() => navigate("/student/applications")}>
                  <FileText className="h-4 w-4 mr-2" /> My Applications
                </Button>
                <Button variant="outline" onClick={() => navigate("/student/my-certificates")}>
                  <Award className="h-4 w-4 mr-2" /> My Certificates
                </Button>
                <Button variant="outline" onClick={() => navigate("/settings")}>
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card bg-gradient-to-br from-primary to-navy-700 text-white">
            <CardContent className="pt-6">
              <div className="text-center">
                {certsLoading ? (
                  <Skeleton className="h-10 w-10 mx-auto bg-white/20" />
                ) : (
                  <div className="text-4xl font-bold text-gold-400">{totalApps}</div>
                )}
                <div className="text-sm text-white/70 mt-1">Total Applications</div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-6 text-center">
                <div>
                  <div className="text-xl font-semibold text-green-400">{approvedCount}</div>
                  <div className="text-xs text-white/60">Approved</div>
                </div>
                <div>
                  <div className="text-xl font-semibold text-yellow-400">{pendingCount}</div>
                  <div className="text-xs text-white/60">Pending</div>
                </div>
                <div>
                  <div className="text-xl font-semibold text-red-400">{rejectedCount}</div>
                  <div className="text-xs text-white/60">Rejected</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certificate Types */}
        <div className="mb-8">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Request Certificate</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {certificateTypes.map((cert) => (
              <Card key={cert.id} className="card-elevated cursor-pointer group" onClick={() => navigate(cert.path)}>
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 rounded-xl ${cert.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <cert.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{cert.title}</h3>
                  <p className="text-xs text-muted-foreground">{cert.description}</p>
                  <div className="mt-4 flex items-center text-accent text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Apply Now
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
            {/* Custom templates from admin */}
            {(customTemplates ?? [])
              .filter(tmpl => tmpl.certificate_type !== "custom" && !certificateTypes.some(c => c.id === tmpl.certificate_type))
              .map((tmpl) => (
              <Card key={tmpl.id} className="card-elevated cursor-pointer group" onClick={() => navigate(`/student/certificates/custom/${tmpl.id}`)}>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{tmpl.template_name}</h3>
                  <p className="text-xs text-muted-foreground">{tmpl.description || "Custom certificate"}</p>
                  <div className="mt-4 flex items-center text-accent text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Apply Now
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Applications</CardTitle>
              <CardDescription>Track your certificate requests</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate("/student/applications")}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {certsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentApps.length > 0 ? (
              <div className="space-y-4">
                {recentApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {getCertificateTypeLabel(app.certificate_type)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Applied on {new Date(app.application_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No applications yet</p>
                <p className="text-sm">Start by requesting a certificate above</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
