import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TourButton } from "@/components/TourButton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Building, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  Filter,
  Eye,
  Edit,
  Briefcase
} from "lucide-react";
import { format } from "date-fns";

export default function Applications({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newApplication, setNewApplication] = useState({
    company: "",
    position: "",
    appliedDate: new Date().toISOString().split('T')[0],
    notes: "",
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["/api/applications"],
  });

  const createApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/applications", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      setAddModalOpen(false);
      setNewApplication({
        company: "",
        position: "",
        appliedDate: new Date().toISOString().split('T')[0],
        notes: "",
      });
      toast({
        title: "Application added successfully",
        description: "Your application has been tracked",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add application",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/applications/${id}/status`, { 
        status,
        responseDate: new Date().toISOString()
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Status updated",
        description: "Application status has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "interviewed": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "offered": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "rejected": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      default: return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "applied": return <Clock className="w-4 h-4" />;
      case "interviewed": return <Eye className="w-4 h-4" />;
      case "offered": return <Trophy className="w-4 h-4" />;
      case "rejected": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredApplications = (applications as any[])?.filter((app: any) => 
    statusFilter === "all" || app.status === statusFilter
  ) || [];

  const handleAddApplication = () => {
    createApplicationMutation.mutate(newApplication);
  };

  const handleViewDetails = (application: any) => {
    setSelectedApplication(application);
    setDetailsModalOpen(true);
  };

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const getStats = () => {
    if (!(applications as any[])?.length) return { total: 0, applied: 0, interviewed: 0, offered: 0, rejected: 0 };
    
    return {
      total: (applications as any[]).length,
      applied: (applications as any[]).filter((app: any) => app.status === "applied").length,
      interviewed: (applications as any[]).filter((app: any) => app.status === "interviewed").length,
      offered: (applications as any[]).filter((app: any) => app.status === "offered").length,
      rejected: (applications as any[]).filter((app: any) => app.status === "rejected").length,
    };
  };

  const stats = getStats();

  const loadingContent = (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg"></div>
        ))}
      </div>
      <div className="h-96 bg-muted rounded-lg"></div>
    </div>
  );

  if (isLoading) {
    return embedded ? loadingContent : (
      <Layout title="Applications" subtitle="Track and manage your job applications">
        {loadingContent}
      </Layout>
    );
  }

  const content = (
    <>
      <div className="flex justify-end mb-4">
        <TourButton tourId="applications" />
      </div>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground" data-testid="total-applications">
                  {stats.total}
                </div>
                <div className="text-sm text-muted-foreground">Total Applications</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600" data-testid="applied-count">
                  {stats.applied}
                </div>
                <div className="text-sm text-muted-foreground">Applied</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600" data-testid="interviewed-count">
                  {stats.interviewed}
                </div>
                <div className="text-sm text-muted-foreground">Interviewed</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600" data-testid="offered-count">
                  {stats.offered}
                </div>
                <div className="text-sm text-muted-foreground">Offers</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600" data-testid="rejected-count">
                  {stats.rejected}
                </div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40" data-testid="status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Applications</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="interviewed">Interviewed</SelectItem>
                      <SelectItem value="offered">Offered</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-application">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Application
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Application</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Company</label>
                      <Input
                        placeholder="Company name"
                        value={newApplication.company}
                        onChange={(e) => setNewApplication(prev => ({ ...prev, company: e.target.value }))}
                        data-testid="input-company"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Position</label>
                      <Input
                        placeholder="Job title"
                        value={newApplication.position}
                        onChange={(e) => setNewApplication(prev => ({ ...prev, position: e.target.value }))}
                        data-testid="input-position"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Applied Date</label>
                      <Input
                        type="date"
                        value={newApplication.appliedDate}
                        onChange={(e) => setNewApplication(prev => ({ ...prev, appliedDate: e.target.value }))}
                        data-testid="input-applied-date"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notes (Optional)</label>
                      <Textarea
                        placeholder="Any additional notes..."
                        value={newApplication.notes}
                        onChange={(e) => setNewApplication(prev => ({ ...prev, notes: e.target.value }))}
                        data-testid="textarea-notes"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => setAddModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddApplication}
                        disabled={!newApplication.company || !newApplication.position || createApplicationMutation.isPending}
                        data-testid="button-save-application"
                      >
                        {createApplicationMutation.isPending ? "Adding..." : "Add Application"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        {filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map((application: any, index: number) => (
              <Card 
                key={application.id}
                className="hover:shadow-md transition-shadow"
                data-testid={`application-${index}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Building className="w-5 h-5 text-muted-foreground" />
                        <h4 className="font-semibold text-lg">{application.company}</h4>
                        <Badge className={getStatusColor(application.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(application.status)}
                            <span className="capitalize">{application.status}</span>
                          </div>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-muted-foreground">
                        <span className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1" />
                          {application.position}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Applied {format(new Date(application.appliedDate), "MMM dd, yyyy")}
                        </span>
                        {application.responseDate && (
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Updated {format(new Date(application.responseDate), "MMM dd, yyyy")}
                          </span>
                        )}
                      </div>

                      {application.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {application.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(application)}
                        data-testid={`button-view-${index}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>

                      <Select
                        value={application.status}
                        onValueChange={(status) => handleUpdateStatus(application.id, status)}
                      >
                        <SelectTrigger className="w-32" data-testid={`status-select-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="interviewed">Interviewed</SelectItem>
                          <SelectItem value="offered">Offered</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  {statusFilter === "all" ? "No applications yet" : `No ${statusFilter} applications`}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {statusFilter === "all" 
                    ? "Start tracking your job applications to stay organized"
                    : `No applications with ${statusFilter} status found`
                  }
                </p>
                <Button onClick={() => setAddModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Application
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Application Details Modal */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedApplication?.position} at {selectedApplication?.company}
              </DialogTitle>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedApplication.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(selectedApplication.status)}
                          <span className="capitalize">{selectedApplication.status}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Applied Date</label>
                    <div className="mt-1 text-sm">
                      {format(new Date(selectedApplication.appliedDate), "MMMM dd, yyyy")}
                    </div>
                  </div>
                </div>

                {selectedApplication.responseDate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <div className="mt-1 text-sm">
                      {format(new Date(selectedApplication.responseDate), "MMMM dd, yyyy")}
                    </div>
                  </div>
                )}

                {selectedApplication.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <div className="mt-1 text-sm bg-muted/50 p-3 rounded-lg">
                      {selectedApplication.notes}
                    </div>
                  </div>
                )}

                {selectedApplication.attachments && selectedApplication.attachments.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Attachments</label>
                    <div className="mt-1 space-y-2">
                      {selectedApplication.attachments.map((attachment: string, i: number) => (
                        <div key={i} className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{attachment}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );

  return embedded ? content : (
    <Layout title="Applications" subtitle="Track and manage your job applications">
      {content}
    </Layout>
  );
}
