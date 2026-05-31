import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Edit, UserCog, Shield } from "lucide-react";
import {
  useAuthorities, useCreateAuthority, useUpdateAuthority, useDeleteAuthority,
  type AuthorityProfile,
} from "@/hooks/useAuthorities";
import { toast } from "sonner";

const DEPARTMENTS = [
  { value: "none", label: "None (General)" },
  { value: "cse", label: "CSE" },
  { value: "ece", label: "ECE" },
  { value: "eee", label: "EEE" },
  { value: "mech", label: "MECH" },
  { value: "civil", label: "CIVIL" },
  { value: "it", label: "IT" },
  { value: "aids", label: "AIDS" },
  { value: "csbs", label: "CSBS" },
];

const getDeptLabel = (dept: string | null) =>
  DEPARTMENTS.find((d) => d.value === dept)?.label ?? "General";

const AuthorityManager = () => {
  const { data: authorities, isLoading } = useAuthorities();
  const createAuthority = useCreateAuthority();
  const updateAuthority = useUpdateAuthority();
  const deleteAuthority = useDeleteAuthority();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingAuthority, setEditingAuthority] = useState<AuthorityProfile | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [department, setDepartment] = useState("none");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setRoleTitle("");
    setDepartment("none");
  };

  const handleCreate = async () => {
    if (!email || !password || !displayName || !roleTitle) {
      toast.error("All fields are required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      await createAuthority.mutateAsync({
        email,
        password,
        display_name: displayName,
        role_title: roleTitle,
        department: department === "none" ? null : department,
      });
      toast.success("Authority created successfully");
      resetForm();
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create authority");
    }
  };

  const handleEdit = (auth: AuthorityProfile) => {
    setEditingAuthority(auth);
    setDisplayName(auth.display_name);
    setRoleTitle(auth.role_title);
    setDepartment(auth.department ?? "none");
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingAuthority || !displayName || !roleTitle) {
      toast.error("All fields are required");
      return;
    }
    try {
      await updateAuthority.mutateAsync({
        authority_user_id: editingAuthority.user_id,
        display_name: displayName,
        role_title: roleTitle,
        department: department === "none" ? null : department,
      });
      toast.success("Authority updated");
      setEditOpen(false);
      setEditingAuthority(null);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  const handleToggleActive = async (auth: AuthorityProfile) => {
    try {
      await updateAuthority.mutateAsync({
        authority_user_id: auth.user_id,
        is_active: !auth.is_active,
      });
      toast.success(`Authority ${auth.is_active ? "deactivated" : "activated"}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (auth: AuthorityProfile) => {
    if (!confirm(`WARNING: Delete authority "${auth.display_name}"?\n\nIf this authority is part of an active Approval Chain, ALL pending certificates waiting for them will be permanently corrupted.\n\nIt is strongly recommended to just toggle them to "Inactive" instead. Proceed with hard deletion?`)) return;
    try {
      await deleteAuthority.mutateAsync(auth.user_id);
      toast.success("Authority deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Authority
        </Button>
      </div>

      {(authorities ?? []).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No authorities created yet</p>
          <p className="text-sm">Create authority logins to manage certificate approvals</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Name</TableHead>
                <TableHead>Role Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(authorities ?? []).map((auth) => (
                <TableRow key={auth.id} className="hover:bg-secondary/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <UserCog className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{auth.display_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{auth.role_title}</Badge>
                  </TableCell>
                  <TableCell>
                    {auth.department ? (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0">
                        {getDeptLabel(auth.department)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">General</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={auth.is_active}
                        onCheckedChange={() => handleToggleActive(auth)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {auth.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(auth)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(auth)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) resetForm(); setCreateOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Authority</DialogTitle>
            <DialogDescription>
              Create a new authority login with a custom role title. They can approve certificate requests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name *</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g., Dr. John Smith" />
            </div>
            <div className="space-y-2">
              <Label>Role Title *</Label>
              <Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="e.g., HOD, Dean, Principal" />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department..." />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Set a department if this authority is a department-specific HOD. Leave as "None" for general roles like Principal.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="authority@college.edu" />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setCreateOpen(false); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createAuthority.isPending}>
              {createAuthority.isPending ? "Creating..." : "Create Authority"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(v) => { if (!v) { resetForm(); setEditingAuthority(null); } setEditOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Authority</DialogTitle>
            <DialogDescription>Update the authority's display name, role title, and department.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name *</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role Title *</Label>
              <Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department..." />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setEditingAuthority(null); setEditOpen(false); }}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateAuthority.isPending}>
              {updateAuthority.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthorityManager;
