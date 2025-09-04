import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ProgressRing";
import { 
  TrendingUp, 
  Send, 
  Route, 
  Trophy, 
  CheckCircle, 
  Play, 
  Clock, 
  Target,
  Upload,
  Wand2,
  Search
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: stats = {}, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: jobMatches = { topJobMatches: [] } } = useQuery({
    queryKey: ["/api/jobs/matches"],
  });

  const { data: activities = { recentActivities: [] } } = useQuery({
    queryKey: ["/api/activities"],
  });

  if (isLoading) {
    return (
      <Layout title={`Welcome back, ${user?.firstName}!`} subtitle="Let's continue building your career path">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const roadmapItems = [
    {
      id: "1",
      title: "Update LinkedIn profile with optimized keywords",
      description: "Increase visibility to recruiters in your target industry",
      status: "completed",
      completedDate: "2 days ago",
      icon: <CheckCircle className="w-5 h-5 text-white" />,
      bgColor: "bg-green-500"
    },
    {
      id: "2", 
      title: "Complete Google Analytics certification",
      description: "Bridge the digital marketing skills gap identified in your analysis",
      status: "in_progress",
      dueDate: "Due in 5 days",
      icon: <Play className="w-5 h-5 text-white" />,
      bgColor: "bg-primary animate-pulse"
    },
    {
      id: "3",
      title: "Apply to 5 target companies",
      description: "Focus on mid-size tech companies with strong growth potential", 
      status: "pending",
      startDate: "Starts in 3 days",
      icon: <Clock className="w-5 h-5 text-muted-foreground" />,
      bgColor: "bg-muted border-2 border-dashed border-muted-foreground"
    }
  ];

  return (
    <Layout 
      title={`Welcome back, ${user?.firstName}!`} 
      subtitle="Let's continue building your career path"
    >
      <div className="space-y-6">
        {/* Progress Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* RMS Score Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Resume Match Score</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="rms-score">
                    {(stats as any)?.rmsScore || 0}
                  </p>
                </div>
                <ProgressRing progress={(stats as any)?.rmsScore || 0} />
              </div>
              <div className="flex items-center space-x-1 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-medium">+12</span>
                <span className="text-muted-foreground">this month</span>
              </div>
            </CardContent>
          </Card>

          {/* Applications Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Applications</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="applications-count">
                    {(stats as any)?.applicationsCount || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Send className="w-6 h-6 text-accent" />
                </div>
              </div>
              <div className="flex items-center space-x-1 text-sm">
                <span className="text-accent font-medium">{(stats as any)?.pendingApplications || 0}</span>
                <span className="text-muted-foreground">pending responses</span>
              </div>
            </CardContent>
          </Card>

          {/* Roadmap Progress Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Roadmap Progress</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="roadmap-progress">
                    {(stats as any)?.roadmapProgress || 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Route className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <Progress value={(stats as any)?.roadmapProgress || 0} className="h-2" />
            </CardContent>
          </Card>

          {/* Achievements Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="achievements-count">
                    {(stats as any)?.achievementsCount || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
              <div className="flex items-center space-x-1 text-sm">
                <span className="text-yellow-600 font-medium">2</span>
                <span className="text-muted-foreground">unlocked this week</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Career Roadmap Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Phase */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Current Phase: 30-Day Sprint</CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <Progress value={75} className="w-20 h-2" />
                    <span className="text-sm font-medium text-primary">75%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roadmapItems.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`roadmap-item-${item.id}`}
                    >
                      <div className={`w-10 h-10 ${item.bgColor} rounded-full flex items-center justify-center`}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={item.status === "completed" ? "default" : 
                                  item.status === "in_progress" ? "secondary" : "outline"}
                          className={
                            item.status === "completed" ? "bg-green-500 text-white" :
                            item.status === "in_progress" ? "bg-primary text-primary-foreground" :
                            "text-muted-foreground"
                          }
                        >
                          {item.status === "completed" ? "Completed" :
                           item.status === "in_progress" ? "In Progress" :
                           "Pending"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.completedDate || item.dueDate || item.startDate}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full mt-4" data-testid="button-view-roadmap">
                  View Full Roadmap
                </Button>
              </CardContent>
            </Card>

            {/* Recent Job Matches */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Top Job Matches</CardTitle>
                  <Button variant="ghost" size="sm" data-testid="button-view-all-jobs">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(jobMatches as any)?.topJobMatches?.slice(0, 2).map((job: any, index: number) => (
                    <div 
                      key={job.id}
                      className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                      data-testid={`job-match-${index}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{job.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {job.company} • {job.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {job.compatibilityScore}%
                          </div>
                          <div className="text-xs text-muted-foreground">Match</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        {job.matchReasons?.slice(0, 2).map((reason: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {reason.length > 15 ? `${reason.substring(0, 15)}...` : reason}
                          </Badge>
                        ))}
                        {job.matchReasons?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.matchReasons.length - 2} more
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {job.skillsGaps?.length || 0} skill gaps identified
                        </p>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" data-testid={`button-tailor-${index}`}>
                            Tailor Resume
                          </Button>
                          <Button size="sm" data-testid={`button-apply-${index}`}>
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No job matches yet. Upload your resume to get started!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* AI Insights Card */}
            <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center">
                    <i className="fas fa-robot text-white text-sm"></i>
                  </div>
                  <span>AI Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-card/60 rounded-lg">
                    <p className="text-sm text-foreground mb-2">
                      <Target className="inline w-4 h-4 mr-1" />
                      <strong>Quick Win:</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Adding "Agile methodology" to your skills could increase your match score by 8-12% for current opportunities.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-card/60 rounded-lg">
                    <p className="text-sm text-foreground mb-2">
                      <TrendingUp className="inline w-4 h-4 mr-1" />
                      <strong>Trending Skill:</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cloud deployment skills are in high demand. Consider AWS certification.
                    </p>
                  </div>
                </div>

                <Button className="w-full mt-4" variant="secondary" data-testid="button-more-insights">
                  Get More Insights
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(activities as any)?.recentActivities?.map((activity: any, index: number) => (
                    <div 
                      key={activity.id}
                      className="flex items-center space-x-3"
                      data-testid={`activity-${index}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === "resume_analyzed" ? "bg-green-500/10" :
                        activity.type === "application_submitted" ? "bg-blue-500/10" :
                        activity.type === "achievement_unlocked" ? "bg-accent/10" :
                        "bg-muted"
                      }`}>
                        {activity.type === "resume_analyzed" && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {activity.type === "application_submitted" && <Send className="w-4 h-4 text-blue-500" />}
                        {activity.type === "achievement_unlocked" && <Trophy className="w-4 h-4 text-accent" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.createdAt), "PPp")}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activity. Start by uploading your resume!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                    data-testid="button-upload-resume"
                  >
                    <Upload className="w-4 h-4 mr-3" />
                    <span className="font-medium">Upload New Resume</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left bg-accent/10 hover:bg-accent/20 text-accent border-accent/20"
                    data-testid="button-generate-cover-letter"
                  >
                    <Wand2 className="w-4 h-4 mr-3" />
                    <span className="font-medium">Generate Cover Letter</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/20"
                    data-testid="button-find-jobs"
                  >
                    <Search className="w-4 h-4 mr-3" />
                    <span className="font-medium">Find New Jobs</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
