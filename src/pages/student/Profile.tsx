import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, User, GraduationCap } from "lucide-react";
import CollegeLogo from "@/components/CollegeLogo";
import DegreeSelection from "@/components/forms/DegreeSelection";
import { SEMESTERS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    roll_number: "",
    degree: "",
    branch: "",
    year: "",
    section: "",
    semester: "",
    academic_year: "",
  });

  useEffect(() => { loadProfile(); }, []);
  useEffect(() => { calculateCompletion(); }, [formData]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setFormData({
          full_name: profile.full_name || "",
          email: profile.email || user.email || "",
          phone: profile.phone || "",
          roll_number: profile.roll_number || "",
          degree: profile.degree || "",
          branch: profile.branch || "",
          year: profile.year || "",
          section: profile.section || "",
          semester: (profile as any).semester || "",
          academic_year: (profile as any).academic_year || "",
        });
      } else {
        const fullName = [
          user.user_metadata?.first_name,
          user.user_metadata?.middle_name,
          user.user_metadata?.last_name,
        ].filter(Boolean).join(" ");

        setFormData((prev) => ({
          ...prev,
          full_name: fullName || "",
          email: user.email || "",
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = () => {
    const required = ["full_name", "email", "roll_number", "degree", "branch", "year", "section", "semester", "academic_year"];
    const filled = required.filter((f) => formData[f as keyof typeof formData]).length;
    setProfileCompletion(Math.round((filled / required.length) * 100));
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          roll_number: formData.roll_number,
          degree: formData.degree,
          branch: formData.branch,
          year: formData.year,
          section: formData.section,
          semester: formData.semester,
          academic_year: formData.academic_year,
        } as any)
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Profile saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="college-header text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <CollegeLogo variant="light" size="md" />
            <Button variant="ghost" onClick={() => navigate("/student/dashboard")} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">Complete your profile to request certificates</p>
          <Card className="mt-4 shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Profile Completion</span>
                <span className="text-sm text-muted-foreground">{profileCompletion}%</span>
              </div>
              <Progress value={profileCompletion} className="h-2" />
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-elevated">
          <Tabs defaultValue="basic" className="w-full">
            <div className="border-b px-6 pt-6">
              <TabsList className="grid grid-cols-2 w-full max-w-sm">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <User className="h-4 w-4" /><span className="hidden sm:inline">Basic Info</span>
                </TabsTrigger>
                <TabsTrigger value="academic" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /><span className="hidden sm:inline">Academic</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="pt-6">
              <TabsContent value="basic" className="mt-0 space-y-6">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={formData.full_name} onChange={(e) => updateFormData("full_name", e.target.value)} className="input-styled" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input value={formData.email} disabled className="input-styled bg-secondary/30" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={formData.phone} onChange={(e) => updateFormData("phone", e.target.value)} className="input-styled" placeholder="+91 XXXXXXXXXX" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Roll Number</Label>
                  <Input value={formData.roll_number} onChange={(e) => updateFormData("roll_number", e.target.value)} className="input-styled" placeholder="Enter your roll number" />
                </div>
              </TabsContent>

              <TabsContent value="academic" className="mt-0 space-y-6">
                <DegreeSelection
                  degree={formData.degree}
                  branch={formData.branch}
                  year={formData.year}
                  section={formData.section}
                  onChange={updateFormData}
                />

                {/* Semester and Academic Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester *</Label>
                    <Select
                      value={formData.semester}
                      onValueChange={(value) => updateFormData("semester", value)}
                    >
                      <SelectTrigger className="input-styled">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {SEMESTERS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="academic_year">Academic Year *</Label>
                    <Input
                      id="academic_year"
                      value={formData.academic_year}
                      onChange={(e) => updateFormData("academic_year", e.target.value)}
                      className="input-styled"
                      placeholder="e.g. 2024-2025"
                    />
                  </div>
                </div>
              </TabsContent>

              <div className="mt-8 flex justify-end">
                <Button onClick={handleSave} disabled={saving || loading} className="btn-navy min-w-[140px]">
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2"><Save className="h-4 w-4" />Save Profile</span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
