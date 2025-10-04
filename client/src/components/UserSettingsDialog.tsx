import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, XCircle, Trash2, User, Briefcase, CreditCard as CardIcon, Shield, CheckCircle } from "lucide-react";

const userSettingsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  school: z.string().optional(),
  major: z.string().optional(),
  gradYear: z.coerce.number().int().min(2000).max(2040).optional().or(z.literal("")),
  targetRole: z.string().optional(),
  location: z.string().optional(),
  remoteOk: z.boolean().default(false),
});

type UserSettingsFormData = z.infer<typeof userSettingsSchema>;

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserSettingsDialog({ open, onOpenChange }: UserSettingsDialogProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const form = useForm<UserSettingsFormData>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      school: user?.school || "",
      major: user?.major || "",
      gradYear: user?.gradYear || "" as any,
      targetRole: user?.targetRole || "",
      location: user?.location || "",
      remoteOk: user?.remoteOk || false,
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (data: UserSettingsFormData) => {
      const response = await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update settings");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Settings Updated",
        description: "Your profile information has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/cancel-subscription", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Subscription Canceled",
        description: "You've been downgraded to the free tier. Your data is still safe.",
      });
      setShowCancelDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const manageBilling = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/billing-portal", {});
      return res.json();
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({
        title: "Billing Portal Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/users/delete-account", {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted.",
      });
      logout();
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserSettingsFormData) => {
    updateSettings.mutate(data);
  };

  const showSaveButtons = activeTab === "profile" || activeTab === "career";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="dialog-user-settings">
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
          <DialogDescription>
            Manage your profile, career preferences, subscription, and account
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile" data-testid="tab-profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="career" data-testid="tab-career">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Career
                </TabsTrigger>
                <TabsTrigger value="subscription" data-testid="tab-subscription">
                  <CardIcon className="w-4 h-4 mr-2" />
                  Subscription
                </TabsTrigger>
                <TabsTrigger value="account" data-testid="tab-account">
                  <Shield className="w-4 h-4 mr-2" />
                  Account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4 mt-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-medium">Why your profile matters:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Your name helps us personalize your experience across the platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Institution details connect you with school-specific resources and opportunities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Accurate information enables better AI-powered career recommendations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Your profile helps track your career development journey over time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Complete profiles receive more relevant job matches and roadmap suggestions</span>
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School / University</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Stanford University" data-testid="input-school" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="career" className="space-y-4 mt-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-medium">How career settings enhance your journey:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Your major helps us match you with industry-specific job opportunities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Graduation year ensures job matches align with your experience level</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Target role focuses AI recommendations on your desired career path</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Location preferences filter opportunities to your preferred geographic areas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Remote work preference expands your opportunities to include distributed teams</span>
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="major"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Major / Field of Study</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Computer Science" data-testid="input-major" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gradYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Graduation Year</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            placeholder="e.g., 2026" 
                            data-testid="input-grad-year"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="targetRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Role</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., Software Engineer, Data Scientist" 
                          data-testid="input-target-role"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Location</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., San Francisco, CA" 
                          data-testid="input-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remoteOk"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Remote Work</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          I'm open to remote opportunities
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-remote-ok"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="subscription" className="space-y-4 mt-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-medium">Subscription benefits and options:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Pro subscription unlocks advanced resume analysis with detailed improvement suggestions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Access unlimited AI career roadmaps and personalized micro-project recommendations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Manage your payment method securely through our billing portal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Cancel anytime - your data remains safe even on the free tier</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Institutional users enjoy full access as part of their school's program</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Current Plan</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant={user?.subscriptionTier === 'paid' ? 'default' : 'secondary'}>
                        {user?.subscriptionTier === 'institutional' ? 'Institutional' : 
                         user?.subscriptionTier === 'paid' ? 'Pro' : 'Free'}
                      </Badge>
                      {user?.subscriptionStatus && (
                        <span className="text-xs text-muted-foreground">
                          ({user.subscriptionStatus})
                        </span>
                      )}
                    </div>

                    {user?.subscriptionTier === 'paid' && (
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => manageBilling.mutate()}
                          disabled={manageBilling.isPending}
                          data-testid="button-manage-billing"
                        >
                          {manageBilling.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CreditCard className="w-4 h-4 mr-2" />
                          )}
                          Change Payment Method
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full justify-start text-orange-600 hover:text-orange-700"
                          onClick={() => setShowCancelDialog(true)}
                          data-testid="button-cancel-subscription"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel Subscription
                        </Button>
                      </div>
                    )}

                    {user?.subscriptionTier === 'free' && (
                      <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                        <h4 className="font-medium mb-2">Upgrade to Pro</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Unlock detailed resume insights, unlimited roadmaps, and priority support for just $10/month
                        </p>
                        <Button className="w-full" data-testid="button-upgrade-to-pro">
                          Upgrade Now
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="account" className="space-y-4 mt-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-medium">Account security and data management:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Your account data is encrypted and stored securely on our servers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>We never share your personal information with third parties without consent</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Deleting your account permanently removes all associated data within 30 days</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>You can export your data before deletion by contacting support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Account deletion is irreversible - please download any important documents first</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-destructive mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => setShowDeleteDialog(true)}
                    data-testid="button-delete-account"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account Permanently
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {showSaveButtons && (
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={updateSettings.isPending}
                  data-testid="button-cancel-settings"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateSettings.isPending}
                  data-testid="button-save-settings"
                >
                  {updateSettings.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>

      {/* Cancel Subscription Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent data-testid="dialog-cancel-subscription">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your subscription will be canceled and you'll be downgraded to the free tier.
              You'll lose access to premium features but your data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-subscription-cancel">
              Keep Subscription
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelSubscription.mutate()}
              disabled={cancelSubscription.isPending}
              className="bg-orange-600 hover:bg-orange-700"
              data-testid="button-cancel-subscription-confirm"
            >
              {cancelSubscription.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Yes, Cancel Subscription"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="dialog-delete-account">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your account and all associated data will be
              permanently deleted. Are you absolutely sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-account-cancel">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAccount.mutate()}
              disabled={deleteAccount.isPending}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-delete-account-confirm"
            >
              {deleteAccount.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete My Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
