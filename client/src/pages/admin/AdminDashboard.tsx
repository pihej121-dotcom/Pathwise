import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Building, 
  TrendingUp, 
  AlertTriangle,
  Settings,
  Database,
  FileText,
  Award,
  BookOpen,
  BarChart3
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for admin dashboard - in real app, these would be API calls
  const mockStats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalApplications: 3451,
    avgRmsScore: 73,
    monthlyGrowth: 12.5,
    riskUsers: 23,
    completionRate: 68,
    avgTimeToOffer: 45
  };

  const mockUsers = [
    { id: 1, name: "John Doe", email: "john@university.edu", rmsScore: 85, lastActive: "2 hours ago", status: "active" },
    { id: 2, name: "Jane Smith", email: "jane@university.edu", rmsScore: 62, lastActive: "1 day ago", status: "at_risk" },
    { id: 3, name: "Bob Johnson", email: "bob@university.edu", rmsScore: 91, lastActive: "3 hours ago", status: "active" },
  ];

  const mockCohorts = [
    { id: 1, name: "Computer Science 2024", users: 156, avgScore: 78, completion: 72 },
    { id: 2, name: "Business Administration 2024", users: 134, avgScore: 71, completion: 65 },
    { id: 3, name: "Engineering 2025", users: 201, avgScore: 82, completion: 80 },
  ];

  return (
    <Layout title="Admin Dashboard" subtitle="Institution-wide analytics and management">
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold" data-testid="total-users">
                    {mockStats.totalUsers.toLocaleString()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div className="mt-2 flex items-center space-x-1 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-medium">+{mockStats.monthlyGrowth}%</span>
                <span className="text-muted-foreground">this month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold" data-testid="active-users">
                    {mockStats.activeUsers.toLocaleString()}
                  </p>
                </div>
                <Building className="w-8 h-8 text-green-500" />
              </div>
              <div className="mt-2">
                <Progress value={(mockStats.activeUsers / mockStats.totalUsers) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg RMS Score</p>
                  <p className="text-2xl font-bold" data-testid="avg-rms">
                    {mockStats.avgRmsScore}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
              <div className="mt-2">
                <Progress value={mockStats.avgRmsScore} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">At-Risk Students</p>
                  <p className="text-2xl font-bold text-red-600" data-testid="risk-users">
                    {mockStats.riskUsers}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Inactive {'>'} 30 days or low RMS
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="cohorts" data-testid="tab-cohorts">Cohorts</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="resources" data-testid="tab-resources">Resources</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Usage Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Resume Analysis</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={85} className="w-24 h-2" />
                        <span className="text-sm font-medium">85%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Job Matching</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={72} className="w-24 h-2" />
                        <span className="text-sm font-medium">72%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Career Roadmap</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={68} className="w-24 h-2" />
                        <span className="text-sm font-medium">68%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">AI Co-Pilot</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={45} className="w-24 h-2" />
                        <span className="text-sm font-medium">45%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Outcome Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Applications Submitted</span>
                      <span className="text-sm font-medium">{mockStats.totalApplications.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Interview Success Rate</span>
                      <span className="text-sm font-medium">34%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Offer Acceptance Rate</span>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg Time to Offer</span>
                      <span className="text-sm font-medium">{mockStats.avgTimeToOffer} days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Platform Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { user: "John Doe", action: "Completed resume analysis", time: "5 minutes ago", type: "success" },
                    { user: "Jane Smith", action: "Applied to Google", time: "1 hour ago", type: "info" },
                    { user: "Bob Johnson", action: "Generated career roadmap", time: "2 hours ago", type: "success" },
                    { user: "Alice Brown", action: "Account flagged as inactive", time: "1 day ago", type: "warning" },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === "success" ? "bg-green-500" :
                          activity.type === "warning" ? "bg-yellow-500" :
                          "bg-blue-500"
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{activity.user}</p>
                          <p className="text-xs text-muted-foreground">{activity.action}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Export Data
                    </Button>
                    <Button size="sm">
                      <Users className="w-4 h-4 mr-2" />
                      Invite Users
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <Badge variant={user.status === "active" ? "default" : "destructive"}>
                            {user.status === "active" ? "Active" : "At Risk"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">RMS: {user.rmsScore}</p>
                          <p className="text-xs text-muted-foreground">Last active: {user.lastActive}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cohorts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Cohort Management</CardTitle>
                  <Button size="sm">
                    <Building className="w-4 h-4 mr-2" />
                    Create Cohort
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCohorts.map((cohort) => (
                    <div key={cohort.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{cohort.name}</h4>
                        <Badge variant="outline">{cohort.users} students</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Average RMS Score</p>
                          <div className="flex items-center space-x-2">
                            <Progress value={cohort.avgScore} className="flex-1 h-2" />
                            <span className="text-sm font-medium">{cohort.avgScore}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Completion Rate</p>
                          <div className="flex items-center space-x-2">
                            <Progress value={cohort.completion} className="flex-1 h-2" />
                            <span className="text-sm font-medium">{cohort.completion}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Analytics charts would be implemented here</p>
                    <p className="text-sm">with libraries like Recharts or Chart.js</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feature Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Resume uploads this month</span>
                      <span className="text-sm font-medium">847</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">AI analyses completed</span>
                      <span className="text-sm font-medium">723</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Roadmaps generated</span>
                      <span className="text-sm font-medium">456</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cover letters created</span>
                      <span className="text-sm font-medium">234</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Resource Management</CardTitle>
                  <Button size="sm">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Add Resource
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Resource management interface</p>
                  <p className="text-sm">Manage courses, certifications, and learning materials</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Institution Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Verification Required</p>
                        <p className="text-sm text-muted-foreground">Require email verification for new accounts</p>
                      </div>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Domain Allowlist</p>
                        <p className="text-sm text-muted-foreground">Only allow emails from university domain</p>
                      </div>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">SSO Integration</p>
                        <p className="text-sm text-muted-foreground">Single sign-on with campus systems</p>
                      </div>
                      <Badge variant="outline">Disabled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feature Flags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Interview Prep Module</p>
                        <p className="text-sm text-muted-foreground">AI-powered interview preparation tools</p>
                      </div>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">AWS Textract OCR</p>
                        <p className="text-sm text-muted-foreground">Enhanced PDF text extraction</p>
                      </div>
                      <Badge variant="outline">Disabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">LTI 1.3 Integration</p>
                        <p className="text-sm text-muted-foreground">Learning Management System integration</p>
                      </div>
                      <Badge variant="outline">Disabled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
