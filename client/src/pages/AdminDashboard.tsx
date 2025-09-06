import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  UserPlus, 
  Crown, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertTriangle,
  Percent,
  Trash2,
  Ban,
  Settings,
  Mail,
  Shield,
  Building,
  Globe,
  Upload,
  Palette,
  FileUp
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  // Single invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("student");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
  // Bulk invite state
  const [bulkEmails, setBulkEmails] = useState("");
  const [bulkRole, setBulkRole] = useState("student");
  const [isBulkInviteDialogOpen, setIsBulkInviteDialogOpen] = useState(false);
  
  // Domain allowlist state
  const [allowedDomain, setAllowedDomain] = useState("");
  const [isAddDomainDialogOpen, setIsAddDomainDialogOpen] = useState(false);
  
  // License management state
  const [seatCap, setSeatCap] = useState<number>(0);
  const [isEditLicenseDialogOpen, setIsEditLicenseDialogOpen] = useState(false);
  
  // User management state
  const [userToTerminate, setUserToTerminate] = useState<string | null>(null);
  const [userToResendVerification, setUserToResendVerification] = useState<string | null>(null);

  // Fetch institution overview data
  const { data: institutionData, isLoading } = useQuery({
    queryKey: [`/api/institutions/${user?.institutionId}`],
    enabled: !!user?.institutionId && (user?.role === "admin" || user?.role === "super_admin"),
  });
  
  // Fetch users and invitations separately for better performance
  const { data: usersData } = useQuery({
    queryKey: [`/api/institutions/${user?.institutionId}/users`],
    enabled: !!user?.institutionId && (user?.role === "admin" || user?.role === "super_admin"),
  });
  
  const { data: invitationsData } = useQuery({
    queryKey: [`/api/institutions/${user?.institutionId}/invitations`],
    enabled: !!user?.institutionId && (user?.role === "admin" || user?.role === "super_admin"),
  });
  
  const { data: licenseData } = useQuery({
    queryKey: [`/api/institutions/${user?.institutionId}/license`],
    enabled: !!user?.institutionId && (user?.role === "admin" || user?.role === "super_admin"),
  });

  // Single invite mutation
  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      return apiRequest("POST", `/api/institutions/${user!.institutionId}/invite`, { email, role });
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "The user will receive an email invitation to join your institution.",
      });
      setInviteEmail("");
      setIsInviteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/institutions/${user?.institutionId}/invitations`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitation",
        description: error.message || "There was an error sending the invitation.",
        variant: "destructive",
      });
    },
  });
  
  // Bulk invite mutation
  const bulkInviteUsersMutation = useMutation({
    mutationFn: async ({ emails, role }: { emails: string[]; role: string }) => {
      return apiRequest("POST", `/api/institutions/${user!.institutionId}/bulk-invite`, { emails, role });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Bulk invitations sent",
        description: `Successfully sent ${data.success || 0} invitations. ${data.failed || 0} failed.`,
      });
      setBulkEmails("");
      setIsBulkInviteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/institutions/${user?.institutionId}/invitations`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send bulk invitations",
        description: error.message || "There was an error sending the bulk invitations.",
        variant: "destructive",
      });
    },
  });
  
  // Add domain allowlist mutation
  const addDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      return apiRequest("POST", `/api/institutions/${user!.institutionId}/domains`, { domain });
    },
    onSuccess: () => {
      toast({
        title: "Domain added",
        description: "Users with this email domain can now self-register.",
      });
      setAllowedDomain("");
      setIsAddDomainDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/institutions/${user?.institutionId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add domain",
        description: error.message || "There was an error adding the domain.",
        variant: "destructive",
      });
    },
  });
  
  // Remove domain mutation
  const removeDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      return apiRequest("DELETE", `/api/institutions/${user!.institutionId}/domains/${encodeURIComponent(domain)}`);
    },
    onSuccess: () => {
      toast({
        title: "Domain removed",
        description: "This email domain can no longer self-register.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/institutions/${user?.institutionId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove domain",
        description: error.message || "There was an error removing the domain.",
        variant: "destructive",
      });
    },
  });
  
  // Update license mutation
  const updateLicenseMutation = useMutation({
    mutationFn: async (licenseData: any) => {
      return apiRequest("PUT", `/api/institutions/${user!.institutionId}/license`, licenseData);
    },
    onSuccess: () => {
      toast({
        title: "License updated",
        description: "License settings have been successfully updated.",
      });
      setIsEditLicenseDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/institutions/${user?.institutionId}/license`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update license",
        description: error.message || "There was an error updating the license.",
        variant: "destructive",
      });
    },
  });

  // Terminate user mutation
  const terminateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/institutions/${user!.institutionId}/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User terminated",
        description: "The user account has been deactivated and access revoked.",
      });
      setUserToTerminate(null);
      queryClient.invalidateQueries({ queryKey: [`/api/institutions/${user?.institutionId}/users`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to terminate user",
        description: error.message || "There was an error terminating the user.",
        variant: "destructive",
      });
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return apiRequest("DELETE", `/api/institutions/${user!.institutionId}/invitations/${invitationId}`);
    },
    onSuccess: () => {
      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled and can no longer be used.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/institutions/${user?.institutionId}/invitations`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to cancel invitation",
        description: error.message || "There was an error cancelling the invitation.",
        variant: "destructive",
      });
    },
  });

  // Resend verification mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/institutions/${user!.institutionId}/users/${userId}/resend-verification`);
    },
    onSuccess: () => {
      toast({
        title: "Verification email sent",
        description: "The user will receive a new verification email.",
      });
      setUserToResendVerification(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send verification email",
        description: error.message || "There was an error sending the verification email.",
        variant: "destructive",
      });
    },
  });

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <Layout>
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access the admin dashboard.</p>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const users = (usersData as any)?.users || [];
  const invitations = (invitationsData as any)?.invitations || [];
  const license = (licenseData as any)?.license;
  const seatInfo = (licenseData as any)?.seatInfo;
  const institution = (institutionData as any)?.institution;

  // Determine default tab based on URL
  const getDefaultTab = () => {
    if (location.includes('/admin/invitations')) return 'invitations';
    if (location.includes('/admin/users')) return 'users';
    if (location.includes('/admin/license')) return 'license';
    if (location.includes('/admin/settings')) return 'access';
    return 'overview';
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail && inviteRole) {
      inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole });
    }
  };

  const handleBulkInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkEmails.trim()) {
      const emails = bulkEmails
        .split(/[,\n]/)
        .map(email => email.trim())
        .filter(email => email && email.includes('@'));
      
      if (emails.length > 0) {
        bulkInviteUsersMutation.mutate({ emails, role: bulkRole });
      }
    }
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (allowedDomain.trim()) {
      addDomainMutation.mutate(allowedDomain.trim());
    }
  };

  const handleUpdateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (seatCap > 0) {
      updateLicenseMutation.mutate({ seatCap });
    }
  };

  const handleTerminateUser = (userId: string) => {
    setUserToTerminate(userId);
  };

  const confirmTerminate = () => {
    if (userToTerminate) {
      terminateUserMutation.mutate(userToTerminate);
    }
  };

  const handleCancelInvitation = (invitationId: string) => {
    cancelInvitationMutation.mutate(invitationId);
  };

  const handleResendVerification = (userId: string) => {
    setUserToResendVerification(userId);
  };

  const confirmResendVerification = () => {
    if (userToResendVerification) {
      resendVerificationMutation.mutate(userToResendVerification);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="admin-dashboard-title">
              Institutional Management
            </h1>
            <p className="text-muted-foreground">
              Access control, licensing, and user lifecycle management for {institution?.name || 'your institution'}
            </p>
          </div>
        </div>

        {/* License Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="active-users">
                {users.filter((u: any) => u.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {users.length} total accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="pending-invitations">
                {invitations.filter((inv: any) => inv.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting registration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">License Usage</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="license-usage">
                {seatInfo?.usedSeats || 0} / {seatInfo?.totalSeats || 0}
              </div>
              <div className="mt-2">
                <Progress 
                  value={seatInfo?.totalSeats ? (seatInfo.usedSeats / seatInfo.totalSeats) * 100 : 0} 
                  className="h-2"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {seatInfo?.totalSeats ? Math.round(((seatInfo.usedSeats / seatInfo.totalSeats) * 100)) : 0}% used
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">License Status</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold" data-testid="license-status">
                {license?.type === 'site' ? 'Site License' : 'Per-Student'}
              </div>
              <p className="text-xs text-muted-foreground">
                {license?.expiresAt 
                  ? `Expires ${new Date(license.expiresAt).toLocaleDateString()}`
                  : "No expiration"
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue={getDefaultTab()} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="invitations" data-testid="tab-invitations">Invitations</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="license" data-testid="tab-license">License</TabsTrigger>
            <TabsTrigger value="access" data-testid="tab-access">Access Control</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserPlus className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" data-testid="quick-invite-button">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite New User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite New User</DialogTitle>
                        <DialogDescription>
                          Send an email invitation to join your institution
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleInviteSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="inviteEmail">Email Address</Label>
                          <Input
                            id="inviteEmail"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="user@university.edu"
                            required
                            data-testid="invite-email-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="inviteRole">Role</Label>
                          <Select value={inviteRole} onValueChange={setInviteRole}>
                            <SelectTrigger data-testid="invite-role-select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={inviteUserMutation.isPending}
                          data-testid="send-invitation-button"
                        >
                          {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="outline" className="w-full" data-testid="manage-license-overview-button">
                    <Crown className="h-4 w-4 mr-2" />
                    Manage License
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">System operational</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{invitations.filter((inv: any) => inv.status === "pending").length} pending invitations</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm">{users.filter((u: any) => u.isActive).length} active users</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            {seatInfo?.totalSeats && (seatInfo.usedSeats / seatInfo.totalSeats) > 0.8 && (
              <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                    <div>
                      <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                        High License Usage
                      </h3>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        You're using {Math.round((seatInfo.usedSeats / seatInfo.totalSeats) * 100)}% of your licensed seats. 
                        Consider upgrading your license if you need additional capacity.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Single Invite */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Single Invitation</span>
                  </CardTitle>
                  <CardDescription>
                    Send an email invitation to one user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" data-testid="single-invite-button">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Send Single Invitation
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite New User</DialogTitle>
                        <DialogDescription>
                          Send an email invitation to join your institution
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleInviteSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="inviteEmail">Email Address</Label>
                          <Input
                            id="inviteEmail"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="user@university.edu"
                            required
                            data-testid="invite-email-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="inviteRole">Role</Label>
                          <Select value={inviteRole} onValueChange={setInviteRole}>
                            <SelectTrigger data-testid="invite-role-select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={inviteUserMutation.isPending}
                          data-testid="send-invitation-button"
                        >
                          {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Bulk Invite */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileUp className="h-5 w-5" />
                    <span>Bulk Invitations</span>
                  </CardTitle>
                  <CardDescription>
                    Send invitations to multiple users via CSV format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={isBulkInviteDialogOpen} onOpenChange={setIsBulkInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full" data-testid="bulk-invite-button">
                        <Upload className="h-4 w-4 mr-2" />
                        Bulk Invite Users
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Bulk Invite Users</DialogTitle>
                        <DialogDescription>
                          Enter email addresses separated by commas or new lines
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleBulkInviteSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="bulkEmails">Email Addresses</Label>
                          <Textarea
                            id="bulkEmails"
                            value={bulkEmails}
                            onChange={(e) => setBulkEmails(e.target.value)}
                            placeholder="user1@university.edu&#10;user2@university.edu&#10;user3@university.edu"
                            rows={6}
                            required
                            data-testid="bulk-emails-input"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            One email per line or separated by commas
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="bulkRole">Role for All Users</Label>
                          <Select value={bulkRole} onValueChange={setBulkRole}>
                            <SelectTrigger data-testid="bulk-role-select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={bulkInviteUsersMutation.isPending}
                          data-testid="send-bulk-invitations-button"
                        >
                          {bulkInviteUsersMutation.isPending ? "Sending..." : "Send Bulk Invitations"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>

            {/* Pending Invitations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pending Invitations</span>
                  <Badge variant="secondary" data-testid="invitations-count">
                    {invitations.filter((inv: any) => inv.status === "pending").length} pending
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invited</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations
                      .filter((invitation: any) => invitation.status === "pending")
                      .map((invitation: any) => (
                        <TableRow key={invitation.id}>
                          <TableCell data-testid={`invitation-email-${invitation.id}`}>
                            {invitation.email}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={invitation.role === "admin" ? "default" : "secondary"}
                              data-testid={`invitation-role-${invitation.id}`}
                            >
                              {invitation.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" data-testid={`invitation-status-${invitation.id}`}>
                              Pending
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`invitation-created-${invitation.id}`}>
                            {new Date(invitation.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell data-testid={`invitation-expires-${invitation.id}`}>
                            {new Date(invitation.expiresAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelInvitation(invitation.id)}
                              disabled={cancelInvitationMutation.isPending}
                              data-testid={`cancel-invitation-${invitation.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>User Management</span>
                  <Badge variant="secondary" data-testid="users-count">
                    {users.length} total users
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userData: any) => (
                      <TableRow key={userData.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium" data-testid={`user-name-${userData.id}`}>
                              {userData.firstName} {userData.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground" data-testid={`user-email-${userData.id}`}>
                              {userData.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={userData.role === "admin" ? "default" : "secondary"}
                            data-testid={`user-role-${userData.id}`}
                          >
                            {userData.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={userData.isActive ? "default" : "destructive"}
                            data-testid={`user-status-${userData.id}`}
                          >
                            {userData.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={userData.isVerified ? "default" : "secondary"}
                            data-testid={`user-verified-${userData.id}`}
                          >
                            {userData.isVerified ? "Verified" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`user-last-activity-${userData.id}`}>
                          {userData.lastActivityAt 
                            ? new Date(userData.lastActivityAt).toLocaleDateString()
                            : "Never"
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {!userData.isVerified && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendVerification(userData.id)}
                                data-testid={`resend-verification-${userData.id}`}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            )}
                            {userData.id !== user?.id && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleTerminateUser(userData.id)}
                                data-testid={`terminate-user-${userData.id}`}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* License Tab */}
          <TabsContent value="license" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="h-5 w-5" />
                    <span>Current License</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>License Type:</span>
                      <span className="font-medium capitalize">{license?.type || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Seats:</span>
                      <span className="font-medium">{seatInfo?.totalSeats || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Used Seats:</span>
                      <span className="font-medium">{seatInfo?.usedSeats || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Available Seats:</span>
                      <span className="font-medium">{(seatInfo?.totalSeats || 0) - (seatInfo?.usedSeats || 0)}</span>
                    </div>
                    {license?.expiresAt && (
                      <div className="flex justify-between text-sm">
                        <span>Expires:</span>
                        <span className="font-medium">{new Date(license.expiresAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {seatInfo?.totalSeats && (seatInfo.usedSeats / seatInfo.totalSeats) > 0.8 && (
                    <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-800 dark:text-amber-200">
                        Seat usage is above 80%. Consider upgrading your license.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>License Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Dialog open={isEditLicenseDialogOpen} onOpenChange={setIsEditLicenseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" data-testid="edit-license-button">
                        <Settings className="h-4 w-4 mr-2" />
                        Modify License Settings
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit License Settings</DialogTitle>
                        <DialogDescription>
                          Modify seat capacity and license configuration
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleUpdateLicense} className="space-y-4">
                        <div>
                          <Label htmlFor="seatCap">Seat Capacity</Label>
                          <Input
                            id="seatCap"
                            type="number"
                            value={seatCap || seatInfo?.totalSeats || 0}
                            onChange={(e) => setSeatCap(Number(e.target.value))}
                            min="1"
                            required
                            data-testid="seat-cap-input"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Current: {seatInfo?.totalSeats || 0} seats
                          </p>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={updateLicenseMutation.isPending}
                          data-testid="update-license-button"
                        >
                          {updateLicenseMutation.isPending ? "Updating..." : "Update License"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Access Control Tab */}
          <TabsContent value="access" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>Domain Allowlist</span>
                  </CardTitle>
                  <CardDescription>
                    Allow users with specific email domains to self-register
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Dialog open={isAddDomainDialogOpen} onOpenChange={setIsAddDomainDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" data-testid="add-domain-button">
                        <Globe className="h-4 w-4 mr-2" />
                        Add Allowed Domain
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Allowed Domain</DialogTitle>
                        <DialogDescription>
                          Users with this email domain can self-register
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddDomain} className="space-y-4">
                        <div>
                          <Label htmlFor="allowedDomain">Email Domain</Label>
                          <Input
                            id="allowedDomain"
                            type="text"
                            value={allowedDomain}
                            onChange={(e) => setAllowedDomain(e.target.value)}
                            placeholder="university.edu"
                            required
                            data-testid="domain-input"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Don't include the @ symbol
                          </p>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={addDomainMutation.isPending}
                          data-testid="add-domain-submit"
                        >
                          {addDomainMutation.isPending ? "Adding..." : "Add Domain"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Allowed Domains:</h4>
                    {institution?.allowedDomains?.length ? (
                      <div className="space-y-2">
                        {institution.allowedDomains.map((domain: string) => (
                          <div key={domain} className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <span className="text-sm font-mono" data-testid={`domain-${domain}`}>
                              @{domain}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeDomainMutation.mutate(domain)}
                              disabled={removeDomainMutation.isPending}
                              data-testid={`remove-domain-${domain}`}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No allowed domains configured</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>SSO Configuration</span>
                  </CardTitle>
                  <CardDescription>
                    Configure single sign-on authentication options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">OIDC/SAML SSO</span>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">SSO-Only Mode</span>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full" disabled data-testid="configure-sso-button">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure SSO
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialogs */}
        
        {/* Terminate User Dialog */}
        <AlertDialog open={!!userToTerminate} onOpenChange={() => setUserToTerminate(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Terminate User Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to terminate this user's account? This action will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Deactivate their account immediately</li>
                  <li>Revoke all active sessions</li>
                  <li>Free up their license seat</li>
                  <li>Prevent them from accessing the platform</li>
                </ul>
                <strong className="text-destructive">This action cannot be undone.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="cancel-terminate">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmTerminate}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={terminateUserMutation.isPending}
                data-testid="confirm-terminate"
              >
                {terminateUserMutation.isPending ? "Terminating..." : "Terminate User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Resend Verification Dialog */}
        <AlertDialog open={!!userToResendVerification} onOpenChange={() => setUserToResendVerification(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resend Verification Email</AlertDialogTitle>
              <AlertDialogDescription>
                This will send a new verification email to the user. They will need to click the link in the email to verify their account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="cancel-resend">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmResendVerification}
                disabled={resendVerificationMutation.isPending}
                data-testid="confirm-resend"
              >
                {resendVerificationMutation.isPending ? "Sending..." : "Send Verification Email"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}