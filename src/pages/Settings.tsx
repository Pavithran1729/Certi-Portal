import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Lock, User, ShieldCheck, Eye, EyeOff } from "lucide-react";
import CollegeLogo from "@/components/CollegeLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Settings = () => {
    const navigate = useNavigate();
    const { user, role } = useAuth();

    // Password change state
    const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
    const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
    const [pwLoading, setPwLoading] = useState(false);

    // Email state
    const [newEmail, setNewEmail] = useState("");
    const [emailLoading, setEmailLoading] = useState(false);

    const dashboardPath =
        role === "admin" || role === "hod"
            ? "/admin/dashboard"
            : role === "authority"
                ? "/authority/dashboard"
                : "/student/dashboard";

    const handlePasswordChange = async () => {
        if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
            toast.error("All password fields are required");
            return;
        }
        if (pwForm.next.length < 6) {
            toast.error("New password must be at least 6 characters");
            return;
        }
        if (pwForm.next !== pwForm.confirm) {
            toast.error("New passwords do not match");
            return;
        }

        setPwLoading(true);
        try {
            // Re-authenticate with current password first
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user?.email || "",
                password: pwForm.current,
            });

            if (signInError) {
                toast.error("Current password is incorrect");
                return;
            }

            // Update to new password
            const { error } = await supabase.auth.updateUser({ password: pwForm.next });
            if (error) throw error;

            toast.success("Password changed successfully");
            setPwForm({ current: "", next: "", confirm: "" });
        } catch (err: any) {
            toast.error(err.message || "Failed to change password");
        } finally {
            setPwLoading(false);
        }
    };

    const handleEmailChange = async () => {
        if (!newEmail || !newEmail.includes("@")) {
            toast.error("Enter a valid email address");
            return;
        }
        if (newEmail === user?.email) {
            toast.error("That's already your current email");
            return;
        }

        setEmailLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;
            toast.success("Confirmation email sent to " + newEmail + ". Check your inbox.");
            setNewEmail("");
        } catch (err: any) {
            toast.error(err.message || "Failed to update email");
        } finally {
            setEmailLoading(false);
        }
    };

    const toggleShow = (field: keyof typeof showPw) =>
        setShowPw((prev) => ({ ...prev, [field]: !prev[field] }));

    return (
        <div className="min-h-screen bg-background">
            <header className="college-header text-white sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <CollegeLogo variant="light" size="md" />
                            <div className="hidden sm:block h-8 w-px bg-white/20" />
                            <span className="hidden sm:block text-sm text-white/70">Account Settings</span>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => navigate(dashboardPath)}
                            className="text-white hover:bg-white/10"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-8">
                    <h1 className="font-serif text-3xl font-bold text-foreground">Account Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage your login credentials and account security</p>
                </div>

                {/* Current Account Info */}
                <Card className="shadow-card mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-primary/10">
                                <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">{user?.email}</p>
                                <p className="text-sm text-muted-foreground capitalize">
                                    Role: {role ?? "—"}
                                </p>
                            </div>
                            <div className="ml-auto">
                                <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Email verified
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-elevated">
                    <Tabs defaultValue="password">
                        <div className="border-b px-6 pt-6">
                            <TabsList className="grid grid-cols-2 w-full max-w-sm">
                                <TabsTrigger value="password" className="flex items-center gap-2">
                                    <Lock className="h-4 w-4" />
                                    Password
                                </TabsTrigger>
                                <TabsTrigger value="email" className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Email
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <CardContent className="pt-6">

                            {/* ── Password Tab ── */}
                            <TabsContent value="password" className="mt-0 space-y-5">
                                <div>
                                    <CardTitle className="text-base mb-1">Change Password</CardTitle>
                                    <CardDescription>
                                        Use a strong password of at least 6 characters. We'll verify your current
                                        password before making any changes.
                                    </CardDescription>
                                </div>

                                {/* Current Password */}
                                <div className="space-y-2">
                                    <Label>Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPw.current ? "text" : "password"}
                                            value={pwForm.current}
                                            onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                                            placeholder="Enter current password"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            onClick={() => toggleShow("current")}
                                        >
                                            {showPw.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPw.next ? "text" : "password"}
                                            value={pwForm.next}
                                            onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                                            placeholder="At least 6 characters"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            onClick={() => toggleShow("next")}
                                        >
                                            {showPw.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {pwForm.next.length > 0 && pwForm.next.length < 6 && (
                                        <p className="text-xs text-destructive">Password must be at least 6 characters</p>
                                    )}
                                </div>

                                {/* Confirm */}
                                <div className="space-y-2">
                                    <Label>Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPw.confirm ? "text" : "password"}
                                            value={pwForm.confirm}
                                            onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                                            placeholder="Repeat new password"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            onClick={() => toggleShow("confirm")}
                                        >
                                            {showPw.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {pwForm.confirm.length > 0 && pwForm.next !== pwForm.confirm && (
                                        <p className="text-xs text-destructive">Passwords do not match</p>
                                    )}
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        onClick={handlePasswordChange}
                                        disabled={pwLoading || !pwForm.current || !pwForm.next || !pwForm.confirm}
                                        className="min-w-[160px]"
                                    >
                                        {pwLoading ? (
                                            <span className="flex items-center gap-2">
                                                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                                Changing...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Lock className="h-4 w-4" />
                                                Change Password
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </TabsContent>

                            {/* ── Email Tab ── */}
                            <TabsContent value="email" className="mt-0 space-y-5">
                                <div>
                                    <CardTitle className="text-base mb-1">Change Email Address</CardTitle>
                                    <CardDescription>
                                        A confirmation link will be sent to your new email. Your current email stays
                                        active until you confirm the change.
                                    </CardDescription>
                                </div>

                                <div className="space-y-2">
                                    <Label>Current Email</Label>
                                    <Input value={user?.email ?? ""} disabled className="bg-secondary/30" />
                                </div>

                                <div className="space-y-2">
                                    <Label>New Email Address</Label>
                                    <Input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="new@example.com"
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        onClick={handleEmailChange}
                                        disabled={emailLoading || !newEmail}
                                        className="min-w-[160px]"
                                    >
                                        {emailLoading ? (
                                            <span className="flex items-center gap-2">
                                                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                                Sending...
                                            </span>
                                        ) : (
                                            "Send Confirmation"
                                        )}
                                    </Button>
                                </div>
                            </TabsContent>

                        </CardContent>
                    </Tabs>
                </Card>
            </main>
        </div>
    );
};

export default Settings;
