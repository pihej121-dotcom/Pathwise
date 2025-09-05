import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  Percent
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("student");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // Fetch institution data including users, invitations, and license info
  const { data: institutionData, isLoading } = useQuery({
    queryKey: [`/api/institutions/${user?.institutionId}/users`],
    enabled: !!user?.institutionId && (user?.role === "admin" || user?.role === "super_admin"),
  });

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      return apiRequest(`/api/institutions/${user!.institutionId}/invite`, {
        method: "POST",
        body: { email, role }
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "The user will receive an email invitation to join your institution.",
      });
      setInviteEmail("");
      setIsInviteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/institutions/${user?.institutionId}/users`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitation",
        description: error.message || "There was an error sending the invitation.",
        variant: "destructive",
      });
    },
  });

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <Layout title="Access Denied">
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
      <Layout title="Admin Dashboard" subtitle="Manage your institution's users and licensing">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const license = institutionData?.license;
  const seatInfo = institutionData?.seatInfo;
  const users = institutionData?.users || [];
  const invitations = institutionData?.invitations || [];

  const usagePercentage = seatInfo?.totalSeats 
    ? Math.round((seatInfo.usedSeats / seatInfo.totalSeats) * 100)
    : 0;

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 80) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <Layout title="Admin Dashboard" subtitle="Manage your institution's users and licensing">
      <div className="space-y-6">
        {/* License Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">License Type</p>
                  <p className="text-2xl font-bold capitalize">
                    {license?.licenseType?.replace('_', ' ') || 'No License'}
                  </p>
                </div>
                <Crown className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Seat Usage</p>
                  <p className="text-2xl font-bold">
                    {seatInfo?.usedSeats || 0}
                    {seatInfo?.totalSeats && ` / ${seatInfo.totalSeats}`}
                  </p>
                  {license?.licenseType === "site" && (
                    <p className="text-xs text-green-600">Unlimited</p>
                  )}
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
              {license?.licenseType === "per_student" && seatInfo?.totalSeats && (
                <div className="mt-4">
                  <Progress value={usagePercentage} className="h-2" />
                  <p className={`text-sm font-medium mt-1 ${getUsageColor(usagePercentage)}`}>
                    {usagePercentage}% used
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">License Expires</p>
                  <p className="text-2xl font-bold">
                    {license?.endDate 
                      ? new Date(license.endDate).toLocaleDateString()
                      : 'No License'
                    }
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Alert */}
        {license?.licenseType === "per_student" && usagePercentage >= 80 && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    High License Usage
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    You're using {usagePercentage}% of your licensed seats. 
                    Consider upgrading your license if you need additional capacity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users and Invitations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Users ({users.length})</CardTitle>
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-invite-user">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite New User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        data-testid="input-invite-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger data-testid="select-invite-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={() => inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole })}
                      disabled={!inviteEmail || inviteUserMutation.isPending}
                      className="w-full"
                      data-testid="button-send-invitation"
                    >
                      {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.slice(0, 10).map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No users yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitations.slice(0, 10).map((invitation: any) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{invitation.role}</Badge>
                      <Badge variant="outline">
                        {invitation.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                        {invitation.status === "claimed" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {invitation.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {invitations.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No pending invitations</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}