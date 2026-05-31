import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import CollegeLogo from "@/components/CollegeLogo";
import ConductForm from "@/components/certificates/ConductForm";
import { useState } from "react";

const ConductPage = () => {
  const navigate = useNavigate();
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  if (submittedId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="college-header text-white sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <CollegeLogo variant="light" size="md" />
            <Button
              variant="ghost"
              onClick={() => navigate("/student/dashboard")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center space-y-6 animate-fade-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-3xl font-bold text-foreground">Request Submitted!</h1>
              <p className="text-muted-foreground">
                Your Conduct Certificate request has been successfully submitted.
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Request ID</p>
              <p className="font-mono font-bold text-foreground text-lg">{submittedId}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              You can track the status of your request in the Applications section of your dashboard.
            </p>
            <Button onClick={() => navigate("/student/dashboard")} className="w-full btn-navy">
              Go to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="college-header text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <CollegeLogo variant="light" size="md" />
          <Button
            variant="ghost"
            onClick={() => navigate("/student/dashboard")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl">
          <div className="mb-8 animate-fade-up">
            <h1 className="font-serif text-3xl font-bold text-foreground">
              Conduct Certificate Request
            </h1>
            <p className="text-muted-foreground mt-2">
              Fill out the form below to request your Conduct Certificate
            </p>
          </div>

          <ConductForm onSuccess={setSubmittedId} />
        </div>
      </main>
    </div>
  );
};

export default ConductPage;
