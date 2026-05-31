import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Download, Eye, FileText, CheckCircle2, LogOut,
  Bell, User, Inbox, Award, Loader2,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import CollegeLogo from "@/components/CollegeLogo";
import { useStudentCertificates, getCertificateTypeLabel } from "@/hooks/useCertificates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import CertificatePreview from "@/components/certificates/CertificatePreview";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const MyCertificates = () => {
  const navigate = useNavigate();
  const { data: certificates, isLoading } = useStudentCertificates();
  const [viewCert, setViewCert] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const certRef = useRef<HTMLDivElement>(null);

  const loadStudentData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    return data;
  };

  const approvedCerts = (certificates ?? []).filter((c) => c.status === "approved");

  const handleViewCert = async (cert: any) => {
    const data = await loadStudentData();
    setStudentData(data);
    setViewCert(cert);
  };

  const generatePDF = useCallback(async (element: HTMLElement, filename: string) => {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // A4 dimensions in mm
    const pdfWidth = 210;
    const pdfHeight = 297;

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const width = imgWidth * ratio;
    const height = imgHeight * ratio;

    const pdf = new jsPDF("portrait", "mm", "a4");
    const x = (pdfWidth - width) / 2;
    const y = (pdfHeight - height) / 2;

    pdf.addImage(imgData, "PNG", x, y, width, height);
    pdf.save(filename);
  }, []);

  const handleDownloadCertificate = async (cert: any) => {
    try {
      setDownloading(cert.id);
      const data = await loadStudentData();

      // Create an offscreen container
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      document.body.appendChild(container);

      // Render certificate to the container
      const { createRoot } = await import("react-dom/client");
      const root = createRoot(container);

      await new Promise<void>((resolve) => {
        root.render(
          <CertificatePreview
            certificateType={cert.certificate_type}
            formData={typeof cert.form_data === "object" ? cert.form_data : {}}
            studentData={data}
            issueDate={cert.issue_date}
          />
        );
        // Give it a moment to render + load images
        setTimeout(resolve, 1000);
      });

      const certElement = container.firstElementChild as HTMLElement;
      if (!certElement) {
        toast.error("Failed to render certificate");
        document.body.removeChild(container);
        return;
      }

      const filename = `${getCertificateTypeLabel(cert.certificate_type).replace(/\s+/g, "_")}_${cert.id.slice(0, 8)}.pdf`;
      await generatePDF(certElement, filename);

      root.unmount();
      document.body.removeChild(container);
      toast.success("Certificate downloaded as PDF!");
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error(`Download failed: ${error?.message || "Check console"}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadFromPreview = async () => {
    if (!certRef.current || !viewCert) return;
    try {
      setDownloading(viewCert.id);
      const filename = `${getCertificateTypeLabel(viewCert.certificate_type).replace(/\s+/g, "_")}_${viewCert.id.slice(0, 8)}.pdf`;
      await generatePDF(certRef.current, filename);
      toast.success("Certificate downloaded as PDF!");
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error(`Download failed: ${error?.message || "Check console"}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
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
              <Button variant="ghost" onClick={handleLogout} className="text-white hover:bg-white/10">
                <LogOut className="h-4 w-4 mr-2" />Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/student/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">My Certificates</h1>
            <p className="text-muted-foreground mt-1">View and download your approved certificates</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : approvedCerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedCerts.map((cert) => (
              <Card key={cert.id} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-success/10">
                        <Award className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {getCertificateTypeLabel(cert.certificate_type)}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Issued {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : "N/A"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="status-approved">
                      <CheckCircle2 className="h-3 w-3 mr-1" />Approved
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewCert(cert)}>
                      <Eye className="h-4 w-4 mr-1" />View
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 btn-navy"
                      onClick={() => handleDownloadCertificate(cert)}
                      disabled={downloading === cert.id}
                    >
                      {downloading === cert.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-1" />
                      )}
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-card">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No approved certificates yet</p>
                <p className="text-sm mt-1">Your approved certificates will appear here for download</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate("/student/dashboard")}>
                  Request a Certificate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Certificate Preview Dialog */}
      <Dialog open={!!viewCert} onOpenChange={(open) => !open && setViewCert(null)}>
        <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {viewCert && getCertificateTypeLabel(viewCert.certificate_type)}
            </DialogTitle>
            <DialogDescription>Certificate preview — you can download as PDF below</DialogDescription>
          </DialogHeader>

          {viewCert && studentData && (
            <div className="space-y-4">
              {/* Certificate render area */}
              <div className="overflow-x-auto px-4">
                <div
                  ref={certRef}
                  className="transform scale-[0.48] origin-top-left"
                  style={{ width: "210mm", minHeight: "297mm" }}
                >
                  <CertificatePreview
                    certificateType={viewCert.certificate_type}
                    formData={typeof viewCert.form_data === "object" ? viewCert.form_data : {}}
                    studentData={studentData}
                    issueDate={viewCert.issue_date}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
                <Button
                  className="flex-1 btn-navy"
                  onClick={handleDownloadFromPreview}
                  disabled={downloading === viewCert?.id}
                >
                  {downloading === viewCert?.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download as PDF
                </Button>
                <Button variant="outline" onClick={() => setViewCert(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyCertificates;
